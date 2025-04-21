import type { AccessControlDocumentPrefix } from 'freedom-access-control-types';
import type { PR, PRFunc } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ForbiddenError, generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentDelta, EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { Trace } from 'freedom-contexts';
import { NotificationManager } from 'freedom-notification-types';
import type { SyncablePath } from 'freedom-sync-types';
import { isSyncableItemEncrypted } from 'freedom-sync-types';
import { TaskQueue } from 'freedom-task-queue';

import { ACCESS_CONTROL_BUNDLE_ID, makeDeltasBundleId, SNAPSHOTS_BUNDLE_ID } from '../../consts/special-file-ids.ts';
import { APPLY_DELTAS_LIMIT_TIME_MSEC } from '../../consts/timing.ts';
import { accessControlDocumentProvider } from '../../internal/context/accessControlDocument.ts';
import { useIsSyncableValidationEnabled } from '../../internal/context/isSyncableValidationEnabled.ts';
import type { ConflictFreeDocumentBundleNotifications } from '../../types/ConflictFreeDocumentBundleNotifications.ts';
import type { ConflictFreeDocumentEvaluator } from '../../types/ConflictFreeDocumentEvaluator.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { SyncableStoreAccessControlDocument } from '../../types/SyncableStoreAccessControlDocument.ts';
import type { WatchableDocument } from '../../types/WatchableDocument.ts';
import { getRoleForOrigin } from '../validation/getRoleForOrigin.ts';
import { getBundleAtPath } from './getBundleAtPath.ts';
import { getOwningAccessControlDocument } from './getOwningAccessControlDocument.ts';
import { getProvenanceOfSyncable } from './getProvenanceOfSyncable.ts';
import { getStringFromFile } from './getStringFromFile.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

export interface GetConflictFreeDocumentFromBundleAtPathArgs {
  /**
   * If `true`, the document will watch for new deltas added to the syncable store and automatically apply them.  If new snapshots are
   * added, a `'needsReload'` notification will be triggered.
   *
   * If `true`, the `stopWatching` method must be called when this document, or watching it, is no longer needed.
   *
   * @defaultValue `false`
   */
  watch?: boolean;
}

export const getConflictFreeDocumentFromBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>>(
    trace: Trace,
    store: SyncableStore,
    path: SyncablePath,
    { loadDocument, isSnapshotValid, isDeltaValidForDocument }: ConflictFreeDocumentEvaluator<PrefixT, DocumentT>,
    { watch = false }: GetConflictFreeDocumentFromBundleAtPathArgs = {}
  ): PR<WatchableDocument<DocumentT>, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const isSyncableValidationEnabled = useIsSyncableValidationEnabled(trace).enabled;
    const isAccessControlBundle = path.lastId === ACCESS_CONTROL_BUNDLE_ID;

    // Snapshots are encrypted if their parent bundle is encrypted
    const areSnapshotsEncrypted = isSyncableItemEncrypted(path.lastId!);

    const notificationManager = new NotificationManager<ConflictFreeDocumentBundleNotifications>();
    const onStopWatching: Array<() => void> = [];
    const stopWatching = () => {
      const toBeRemoved = [...onStopWatching];
      onStopWatching.length = 0;
      for (const removeListener of toBeRemoved) {
        removeListener();
      }
    };

    const snapshotsBundlePath = path.append(SNAPSHOTS_BUNDLE_ID({ encrypted: areSnapshotsEncrypted }));

    // This function is replaced once the document is initially loaded
    let getSnapshotId = (): string | undefined => undefined;

    let applyDeltasToDocument:
      | PRFunc<undefined, 'not-found' | 'deleted' | 'untrusted' | 'wrong-type' | 'format-error', [deltaPaths: SyncablePath[]]>
      | undefined;

    // TODO: this doesn't reevaluate permissions changes or previously rejected deltas etc
    /** Will be set to `true` if a newer snapshot is added */
    let needsReload = false;
    let applyPendingDeltas = async () => {};
    if (watch) {
      const pendingDeltaPaths: SyncablePath[] = [];
      const pendingDeltasTaskQueue = new TaskQueue(trace);
      pendingDeltasTaskQueue.start({ maxConcurrency: 1, delayWhenEmptyMSec: APPLY_DELTAS_LIMIT_TIME_MSEC });
      onStopWatching.push(() => pendingDeltasTaskQueue.stop());

      const applyPendingDeltasNow = makeAsyncResultFunc([import.meta.filename, 'applyPendingDeltasNow'], async (trace): PR<undefined> => {
        notificationManager.notify('willApplyDeltas', { path });

        let numDeltasApplied = 0;
        while (applyDeltasToDocument !== undefined && pendingDeltaPaths.length > 0) {
          const deltaPaths = [...pendingDeltaPaths];
          pendingDeltaPaths.length = 0;

          const appliedDeltas = await applyDeltasToDocument?.(trace, deltaPaths);
          if (!appliedDeltas.ok) {
            return generalizeFailureResult(trace, appliedDeltas, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
          }
          numDeltasApplied += deltaPaths.length;
        }

        notificationManager.notify('didApplyDeltas', { path, numDeltasApplied });

        return makeSuccess(undefined);
      });
      applyPendingDeltas = async () => await pendingDeltasTaskQueue.wait();

      onStopWatching.push(
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
          } else if (event.type === 'file') {
            const currentSnapshotDeltasBundlePath = path.append(
              makeDeltasBundleId({ encrypted: areSnapshotsEncrypted }, currentSnapshotId)
            );

            if (event.path.startsWith(currentSnapshotDeltasBundlePath)) {
              pendingDeltaPaths.push(event.path);
              pendingDeltasTaskQueue.add('apply-pending-deltas', applyPendingDeltasNow);
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

    const snapshots = await docBundle.value.get(trace, SNAPSHOTS_BUNDLE_ID({ encrypted: areSnapshotsEncrypted }), 'bundle');
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
      return makeFailure(new NotFoundError(trace, { message: `No snapshots found for: ${path.toString()}`, errorCode: 'not-found' }));
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

      const encodedSnapshot = await getStringFromFile(trace, store, snapshotFile.value);
      /* node:coverage disable */
      if (!encodedSnapshot.ok) {
        return encodedSnapshot;
      }
      /* node:coverage enable */

      let accessControlDoc: SyncableStoreAccessControlDocument | undefined;
      if (isSyncableValidationEnabled) {
        if (isAccessControlBundle) {
          // Access control bundles are specially validated

          accessControlDoc = new SyncableStoreAccessControlDocument({
            snapshot: { id: snapshotId, encoded: encodedSnapshot.value as EncodedConflictFreeDocumentSnapshot<AccessControlDocumentPrefix> }
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
          DEV: debugTopic('VALIDATION', (log) => log(`Snapshot invalid for ${snapshotFile.value.path.toString()}`));
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
        async (trace, deltaPaths: SyncablePath[]): PR<undefined, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
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

            const encodedDelta = await getStringFromFile(trace, store, deltaFile.value);
            if (!encodedDelta.ok) {
              return encodedDelta;
            }

            // For not-yet-accepted values, performing additional checks
            if (isSyncableValidationEnabled && deltaProvenance.value.acceptance === undefined) {
              const originRole = await getOriginRole();
              if (!originRole.ok) {
                return generalizeFailureResult(trace, originRole, 'not-found');
              } else if (originRole.value === undefined) {
                // This shouldn't happen
                return makeFailure(new ForbiddenError(trace, { message: 'No role found' }));
              }

              const deltaValid = await isDeltaValidForDocument(trace, document.clone() as DocumentT, {
                store,
                path: deltaFile.value.path,
                validatedProvenance: deltaProvenance.value,
                originRole: originRole.value,
                encodedDelta: encodedDelta.value as EncodedConflictFreeDocumentDelta<PrefixT>
              });
              if (!deltaValid.ok) {
                return deltaValid;
              } else if (!deltaValid.value) {
                DEV: debugTopic('VALIDATION', (log) => log(`Delta invalid for ${deltaFile.value.path.toString()}`));
                continue;
              }
            }

            // If this is an access control bundle, this is also how it will progressively load
            document.applyDeltas([encodedDelta.value as EncodedConflictFreeDocumentDelta<PrefixT>], { updateDeltaBasis: false });
            numAppliedDeltas += 1;
          }

          if (numAppliedDeltas > 0) {
            document.updateDeltaBasis();
          }

          return makeSuccess(undefined);
        }
      );

      // Deltas are encrypted if their parent bundle is encrypted
      const areDeltaEncrypted = isSyncableItemEncrypted(path.lastId!);
      const deltas = await docBundle.value.get(trace, makeDeltasBundleId({ encrypted: areDeltaEncrypted }, snapshotId), 'bundle');
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

      return makeSuccess({
        document,
        addListener: notificationManager.addListener,
        get needsReload() {
          return needsReload;
        },
        applyPendingDeltas,
        stopWatching
      });
    }

    return makeFailure(new NotFoundError(trace, { message: `No valid snapshots found for: ${path.toString()}`, errorCode: 'not-found' }));
  }
);
