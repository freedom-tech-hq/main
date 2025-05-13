import type { AccessControlDocumentPrefix } from 'freedom-access-control-types';
import type { PR, PRFunc } from 'freedom-async';
import { allResultsMapped, debugTopic, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ForbiddenError, generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentDelta, EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import { makeUuid, type Trace } from 'freedom-contexts';
import type { OnCacheEntryInvalidatedCallback } from 'freedom-in-memory-cache';
import { InMemoryCache } from 'freedom-in-memory-cache';
import { InMemoryLockStore, withAcquiredLock } from 'freedom-locking-types';
import { NotificationManager } from 'freedom-notification-types';
import type { SyncablePath } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath, isSyncableItemEncrypted } from 'freedom-sync-types';
import type {
  ConflictFreeDocumentBundleNotifications,
  ConflictFreeDocumentEvaluator,
  ISyncableStoreAccessControlDocument,
  SyncableStore,
  WatchableDocument
} from 'freedom-syncable-store-types';
import { ACCESS_CONTROL_BUNDLE_ID, makeDeltasBundleId, SNAPSHOTS_BUNDLE_ID } from 'freedom-syncable-store-types';
import { TaskQueue } from 'freedom-task-queue';
import { noop } from 'lodash-es';

import { disableSyncableValidation, useIsSyncableValidationEnabled } from '../../context/isSyncableValidationEnabled.ts';
import { APPLY_DELTAS_LIMIT_TIME_MSEC, CACHE_DURATION_MSEC } from '../../internal/consts/timing.ts';
import { accessControlDocumentProvider } from '../../internal/context/accessControlDocument.ts';
import { SyncableStoreAccessControlDocument } from '../../types/SyncableStoreAccessControlDocument.ts';
import { getRoleForOrigin } from '../validation/getRoleForOrigin.ts';
import { getBundleAtPath } from './getBundleAtPath.ts';
import { getOwningAccessControlDocument } from './getOwningAccessControlDocument.ts';
import { getProvenanceOfSyncable } from './getProvenanceOfSyncable.ts';
import { getStringFromFile } from './getStringFromFile.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

const globalDocumentCache = new InMemoryCache<string, WatchableDocument<any>, SyncableStore>({
  cacheDurationMSec: CACHE_DURATION_MSEC,
  shouldResetIntervalOnGet: true
});

const globalLockStore = new InMemoryLockStore();

export interface GetConflictFreeDocumentFromBundleAtPathArgs {
  /**
   * If `true`, the document will watch for new snapshots and deltas added to the syncable store.  It will automatically apply deltas.  If
   * new snapshots are added, a `'needsReload'` notification will be triggered.  The `stopWatching` method must be called when this
   * document, or watching it, is no longer needed.  The document is also cached, where the cache duration will extend until at least
   * `stopWatching` is called (at least once per returned instance) and may extended slightly longer.  Subsequent requests during the cached
   * interval for the same path will return the same document instance.  `stopWatching` should be called for each instance however.
   *
   * If `false`, the document is loaded once and not watched or cached.
   *
   * If `'auto'`, this behaves like `watch = true`, except that the document is immediately unwatched.  The benefit of this is not having to
   * call `stopWatching` but still getting reasonable caching behavior.  This just isn't great for user-time live documents -- for example
   * where a user could be editing a document over an arbitrary amount of time.
   *
   * @defaultValue `'auto'`
   */
  watch?: boolean | 'auto';
}

export const getConflictFreeDocumentFromBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>>(
    trace: Trace,
    store: SyncableStore,
    path: SyncablePath,
    { loadDocument, isSnapshotValid, isDeltaValidForDocument }: ConflictFreeDocumentEvaluator<PrefixT, DocumentT>,
    { watch = 'auto' }: GetConflictFreeDocumentFromBundleAtPathArgs = {}
  ): PR<WatchableDocument<DocumentT>, 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const pathString = path.toString();

    // Snapshots and deltas are encrypted if their parent bundle is encrypted
    const isEncrypted = isSyncableItemEncrypted(path.lastId!);

    // When watch = true, we only want one in-flight operation per path so that caching can be handled properly
    const result = await withAcquiredLock(
      trace,
      globalLockStore.lock(watch !== false ? pathString : makeUuid()),
      {},
      async (trace): PR<WatchableDocument<DocumentT>, 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
        switch (watch) {
          case false:
            // No caching is used
            break;
          case 'auto': {
            // Default caching retention period is used
            const cached = globalDocumentCache.get(store, pathString);
            if (cached !== undefined) {
              return makeSuccess({ ...cached, stopWatching: noop });
            }
            break;
          }
          case true: {
            // The cache must be explicitly released
            const cached = globalDocumentCache.getRetained(store, pathString);
            if (cached !== undefined) {
              return makeSuccess({ ...cached.value, stopWatching: cached.release });
            }
            break;
          }
        }

        const isSyncableValidationEnabled = useIsSyncableValidationEnabled(trace).enabled;
        const isAccessControlBundle = path.lastId === ACCESS_CONTROL_BUNDLE_ID;

        const notificationManager = new NotificationManager<ConflictFreeDocumentBundleNotifications>();
        const onCacheInvalidatedSteps: Array<() => void> = [];
        const onCacheInvalidated: OnCacheEntryInvalidatedCallback<string, WatchableDocument<any>> = (_key, value) => {
          value.stopWatching();

          const steps = [...onCacheInvalidatedSteps];
          onCacheInvalidatedSteps.length = 0;
          for (const step of steps) {
            step();
          }
        };

        const snapshotsBundlePath = path.append(SNAPSHOTS_BUNDLE_ID({ encrypted: isEncrypted }));

        // This function is replaced once the document is initially loaded
        let getSnapshotId = (): string | undefined => undefined;

        let applyDeltasToDocument:
          | PRFunc<undefined, 'not-found' | 'untrusted' | 'wrong-type' | 'format-error', [deltaPaths: SyncablePath[]]>
          | undefined;

        // TODO: this doesn't reevaluate permissions changes or previously rejected deltas etc
        /** Will be set to `true` if a newer snapshot is added */
        let needsReload = false;
        let applyPendingDeltas = async () => {};
        if (watch !== false) {
          const pendingDeltaPaths: SyncablePath[] = [];
          const pendingDeltasTaskQueue = new TaskQueue('crdt-pending-deltas', trace);
          pendingDeltasTaskQueue.start({ maxConcurrency: 1, delayWhenEmptyMSec: APPLY_DELTAS_LIMIT_TIME_MSEC });
          onCacheInvalidatedSteps.push(() => pendingDeltasTaskQueue.stop());

          const applyPendingDeltasNow = makeAsyncResultFunc(
            [import.meta.filename, 'applyPendingDeltasNow'],
            async (trace): PR<undefined> => {
              notificationManager.notify('willApplyDeltas', { path });

              let numDeltasApplied = 0;
              while (applyDeltasToDocument !== undefined && pendingDeltaPaths.length > 0) {
                const deltaPaths = [...pendingDeltaPaths];
                pendingDeltaPaths.length = 0;

                const appliedDeltas = await applyDeltasToDocument?.(trace, deltaPaths);
                if (!appliedDeltas.ok) {
                  return generalizeFailureResult(trace, appliedDeltas, ['format-error', 'not-found', 'untrusted', 'wrong-type']);
                }
                numDeltasApplied += deltaPaths.length;
              }

              notificationManager.notify('didApplyDeltas', { path, numDeltasApplied });

              return makeSuccess(undefined);
            }
          );
          applyPendingDeltas = async () => await pendingDeltasTaskQueue.wait();

          onCacheInvalidatedSteps.push(
            store.addListener('itemAdded', (event) => {
              const currentSnapshotId = getSnapshotId();
              if (currentSnapshotId === undefined) {
                return; // Not ready
              }

              if (event.path.startsWith(snapshotsBundlePath)) {
                // If a newer snapshot was added, we need to reload the document

                // Snapshot names are prefixed by ISO timestamps, so we can compare them lexicographically
                if (!needsReload && event.path.ids[snapshotsBundlePath.ids.length] > currentSnapshotId) {
                  notificationManager.notify('needsReload', { path });
                  needsReload = true;
                }
              } else if (extractSyncableItemTypeFromPath(event.path) === 'file') {
                const currentSnapshotDeltasBundlePath = path.append(makeDeltasBundleId({ encrypted: isEncrypted }, currentSnapshotId));

                if (event.path.startsWith(currentSnapshotDeltasBundlePath)) {
                  pendingDeltaPaths.push(event.path);
                  pendingDeltasTaskQueue.add({ key: 'apply-pending-deltas', version: makeUuid() }, applyPendingDeltasNow);
                }
              }
            })
          );
        }

        const docBundle = await getBundleAtPath(trace, store, path);
        /* node:coverage disable */
        if (!docBundle.ok) {
          return docBundle;
        }
        /* node:coverage enable */

        const snapshots = await docBundle.value.get(trace, SNAPSHOTS_BUNDLE_ID({ encrypted: isEncrypted }), 'bundle');
        /* node:coverage disable */
        if (!snapshots.ok) {
          return snapshots;
        }
        /* node:coverage enable */

        const snapshotIds = await snapshots.value.getIds(trace, { type: 'file' });
        /* node:coverage disable */
        if (!snapshotIds.ok) {
          return snapshotIds;
        } else if (snapshotIds.value.length === 0) {
          /* node:coverage enable */
          return makeFailure(new NotFoundError(trace, { message: `No snapshots found for: ${pathString}`, errorCode: 'not-found' }));
        }

        // TODO: should really try to load approved snapshots first and then not-yet-approved ones
        // Snapshot names are prefixed by ISO timestamps, so sorting them will give us the most recent one last
        snapshotIds.value.sort();

        let snapshotIndex = snapshotIds.value.length - 1;
        while (snapshotIndex >= 0) {
          const snapshotId = snapshotIds.value[snapshotIndex];
          snapshotIndex -= 1;

          getSnapshotId = () => snapshotId;

          const snapshotFile = await snapshots.value.get(trace, snapshotId, 'file');
          if (!snapshotFile.ok) {
            return snapshotFile;
          }

          const encodedSnapshot = await getStringFromFile(trace, store, snapshotFile.value, { checkForDeletion: false });
          /* node:coverage disable */
          if (!encodedSnapshot.ok) {
            return generalizeFailureResult(trace, encodedSnapshot, 'deleted');
          }
          /* node:coverage enable */

          let accessControlDoc: ISyncableStoreAccessControlDocument | undefined;
          if (isSyncableValidationEnabled) {
            if (isAccessControlBundle) {
              // Access control bundles are specially validated

              accessControlDoc = new SyncableStoreAccessControlDocument({
                snapshot: {
                  id: snapshotId,
                  encoded: encodedSnapshot.value as EncodedConflictFreeDocumentSnapshot<AccessControlDocumentPrefix>
                }
              });
            } else {
              const foundAccessControlDoc = await getOwningAccessControlDocument(trace, store, path);
              if (!foundAccessControlDoc.ok) {
                return foundAccessControlDoc;
              }

              accessControlDoc = foundAccessControlDoc.value;
            }
          }

          // This is already validated when the file is retrieved
          const snapshotProvenance = await getProvenanceOfSyncable(trace, store, snapshotFile.value);
          if (!snapshotProvenance.ok) {
            return snapshotProvenance;
          }

          const getOriginRole = () =>
            getRoleForOrigin(trace, store, { origin: snapshotProvenance.value.origin, accessControlDoc: accessControlDoc! });

          // For not-yet-accepted values, performing additional checks
          if (isSyncableValidationEnabled && !isAccessControlBundle && snapshotProvenance.value.acceptance === undefined) {
            const originRole = await getOriginRole();
            if (!originRole.ok) {
              return generalizeFailureResult(trace, originRole, 'not-found');
            } else if (originRole.value === undefined) {
              // This shouldn't happen
              return makeFailure(new ForbiddenError(trace, { message: 'No role found' }));
            }

            const snapshotValid = await isSnapshotValid(trace, {
              store,
              path: snapshotFile.value.path,
              validatedProvenance: snapshotProvenance.value,
              originRole: originRole.value,
              snapshot: { id: snapshotId, encoded: encodedSnapshot.value as EncodedConflictFreeDocumentSnapshot<PrefixT> }
            });
            if (!snapshotValid.ok) {
              return snapshotValid;
            } else if (!snapshotValid.value) {
              DEV: debugTopic('VALIDATION', (log) => log(trace, `Snapshot invalid for ${snapshotFile.value.path.toShortString()}`));
              continue;
            }
          }

          const document = (
            isAccessControlBundle && accessControlDoc !== undefined
              ? accessControlDoc
              : loadDocument({ id: snapshotId, encoded: encodedSnapshot.value as EncodedConflictFreeDocumentSnapshot<PrefixT> })
          ) as DocumentT;

          getSnapshotId = () => document.snapshotId;

          applyDeltasToDocument = makeAsyncResultFunc(
            [import.meta.filename, 'applyDeltasToDocument'],
            async (trace, deltaPaths: SyncablePath[]): PR<undefined, 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
              const encodedDataByPathString: Partial<Record<string, string>> = {};
              const loaded = await allResultsMapped(
                trace,
                deltaPaths,
                {},
                async (trace, deltaPath): PR<undefined, 'not-found' | 'untrusted' | 'wrong-type' | 'format-error'> => {
                  // Not checking syncable validation here because we're just pre-loading the strings.  Validation is performed by calling
                  // getSyncableAtPath below.
                  const encodedDelta = await disableSyncableValidation(getStringFromFile)(trace, store, deltaPath, {
                    checkForDeletion: false
                  });
                  if (!encodedDelta.ok) {
                    return generalizeFailureResult(trace, encodedDelta, 'deleted');
                  }

                  encodedDataByPathString[deltaPath.toString()] = encodedDelta.value;

                  return makeSuccess(undefined);
                }
              );
              if (!loaded.ok) {
                return loaded;
              }

              let numAppliedDeltas = 0;
              for (const deltaPath of deltaPaths) {
                // Using a potentially progressively loaded access control document for validating deltas.  If this bundle is itself an access
                // control document, it will be progressively loaded as it's validated
                const deltaFile = await accessControlDocumentProvider(trace, accessControlDoc, (trace) =>
                  getSyncableAtPath(trace, store, deltaPath, 'file')
                );
                if (!deltaFile.ok) {
                  return deltaFile;
                }

                // This is already validated when the file is retrieved
                const deltaProvenance = await getProvenanceOfSyncable(trace, store, deltaFile.value);
                if (!deltaProvenance.ok) {
                  return deltaProvenance;
                }

                const encodedDelta = encodedDataByPathString[deltaPath.toString()] as EncodedConflictFreeDocumentDelta<PrefixT>;

                // For not-yet-accepted values, performing additional checks
                if (isSyncableValidationEnabled && deltaProvenance.value.acceptance === undefined) {
                  const originRole = await getOriginRole();
                  if (!originRole.ok) {
                    return generalizeFailureResult(trace, originRole, 'not-found');
                  } else if (originRole.value === undefined) {
                    // This shouldn't happen
                    return makeFailure(new ForbiddenError(trace, { message: 'No role found' }));
                  }

                  const deltaValid = await isDeltaValidForDocument(trace, (await document.clone()) as DocumentT, {
                    store,
                    path: deltaFile.value.path,
                    validatedProvenance: deltaProvenance.value,
                    originRole: originRole.value,
                    encodedDelta
                  });
                  if (!deltaValid.ok) {
                    return deltaValid;
                  } else if (!deltaValid.value) {
                    DEV: debugTopic('VALIDATION', (log) => log(trace, `Delta invalid for ${deltaFile.value.path.toShortString()}`));
                    continue;
                  }
                }

                // If this is an access control bundle, this is also how it will progressively load
                document.applyDeltas([encodedDelta], { updateDeltaBasis: false });
                numAppliedDeltas += 1;
              }

              if (numAppliedDeltas > 0) {
                document.updateDeltaBasis();
              }

              return makeSuccess(undefined);
            }
          );

          const deltas = await docBundle.value.get(trace, makeDeltasBundleId({ encrypted: isEncrypted }, snapshotId), 'bundle');
          /* node:coverage disable */
          if (!deltas.ok) {
            return deltas;
          }
          /* node:coverage enable */

          const deltaIds = await deltas.value.getIds(trace, { type: 'file' });
          /* node:coverage disable */
          if (!deltaIds.ok) {
            return deltaIds;
          }
          /* node:coverage enable */

          // TODO: should really try to load approved deltas first and then not-yet-approved ones
          // Delta names are prefixed by ISO timestamps, so sorting them will give us the most recent one last
          deltaIds.value.sort();

          const deltaPaths = deltaIds.value.map((id) => deltas.value.path.append(id));
          const appliedDeltas = await applyDeltasToDocument(trace, deltaPaths);
          if (!appliedDeltas.ok) {
            return appliedDeltas;
          }

          const watchableDocument: WatchableDocument<DocumentT> = {
            document,
            addListener: notificationManager.addListener,
            get needsReload() {
              return needsReload;
            },
            applyPendingDeltas,
            stopWatching: () => {} // Replaced before returning, when watch is true
          };

          switch (watch) {
            case false:
              // No caching is used
              break;
            case 'auto': {
              // Default caching retention period is used
              globalDocumentCache.set(store, pathString, watchableDocument, { onInvalidated: onCacheInvalidated });

              return makeSuccess({ ...watchableDocument, stopWatching: noop });
            }
            case true: {
              // The cache must be explicitly released
              const { release } = globalDocumentCache.setRetained(store, pathString, watchableDocument, {
                onInvalidated: onCacheInvalidated
              });

              return makeSuccess({ ...watchableDocument, stopWatching: release });
            }
          }

          return makeSuccess(watchableDocument);
        }

        return makeFailure(
          new NotFoundError(trace, { message: `No valid snapshots found for: ${path.toString()}`, errorCode: 'not-found' })
        );
      }
    );
    if (!result.ok) {
      return generalizeFailureResult(trace, result, 'lock-timeout');
    }

    return makeSuccess(result.value);
  }
);
