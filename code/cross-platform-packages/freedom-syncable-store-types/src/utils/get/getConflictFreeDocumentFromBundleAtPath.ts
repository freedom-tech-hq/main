import type { AccessControlDocumentPrefix } from 'freedom-access-control-types';
import type { PR, PRFunc } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ForbiddenError, generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentDelta, EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { Trace } from 'freedom-contexts';
import type { SyncablePath, SyncableProvenance } from 'freedom-sync-types';
import { isSyncableItemEncrypted } from 'freedom-sync-types';

import { ACCESS_CONTROL_BUNDLE_ID, makeDeltasBundleId, SNAPSHOTS_BUNDLE_ID } from '../../consts/special-file-ids.ts';
import { accessControlDocumentProvider } from '../../internal/context/accessControlDocument.ts';
import { useIsSyncableValidationEnabled } from '../../internal/context/isSyncableValidationEnabled.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { SyncableStoreAccessControlDocument } from '../../types/SyncableStoreAccessControlDocument.ts';
import type { SyncableStoreRole } from '../../types/SyncableStoreRole.ts';
import { getRoleForOrigin } from '../validation/getRoleForOrigin.ts';
import { getBundleAtPath } from './getBundleAtPath.ts';
import { getOwningAccessControlDocument } from './getOwningAccessControlDocument.ts';
import { getProvenanceOfSyncable } from './getProvenanceOfSyncable.ts';
import { getStringFromFile } from './getStringFromFile.ts';

export interface IsConflictFreeDocumentSnapshotValidArgs<PrefixT extends string> {
  store: SyncableStore;
  path: SyncablePath;
  validatedProvenance: SyncableProvenance;
  originRole: SyncableStoreRole;
  snapshot: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<PrefixT> };
}
export type IsConflictFreeDocumentSnapshotValidFunc<PrefixT extends string> = PRFunc<
  boolean,
  never,
  [IsConflictFreeDocumentSnapshotValidArgs<PrefixT>]
>;

export interface IsDeltaValidForConflictFreeDocumentArgs<PrefixT extends string> {
  store: SyncableStore;
  path: SyncablePath;
  validatedProvenance: SyncableProvenance;
  originRole: SyncableStoreRole;
  encodedDelta: EncodedConflictFreeDocumentDelta<PrefixT>;
}
export type IsDeltaValidForConflictFreeDocumentFunc<PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>> = PRFunc<
  boolean,
  never,
  [document: DocumentT, IsDeltaValidForConflictFreeDocumentArgs<PrefixT>]
>;

export interface GetConflictFreeDocumentFromBundleAtPathArgs<PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>> {
  newDocument: (snapshot: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<PrefixT> }) => DocumentT;
  isSnapshotValid: IsConflictFreeDocumentSnapshotValidFunc<PrefixT>;
  isDeltaValidForDocument: IsDeltaValidForConflictFreeDocumentFunc<PrefixT, DocumentT>;
}

export const getConflictFreeDocumentFromBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>>(
    trace: Trace,
    store: SyncableStore,
    path: SyncablePath,
    { newDocument, isSnapshotValid, isDeltaValidForDocument }: GetConflictFreeDocumentFromBundleAtPathArgs<PrefixT, DocumentT>
  ): PR<{ document: DocumentT }, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const isSyncableValidationEnabled = useIsSyncableValidationEnabled(trace).enabled;
    const isAccessControlBundle = path.lastId === ACCESS_CONTROL_BUNDLE_ID;

    const docBundle = await getBundleAtPath(trace, store, path);
    /* node:coverage disable */
    if (!docBundle.ok) {
      return docBundle;
    }
    /* node:coverage enable */

    // Snapshots are encrypted if their parent bundle is encrypted
    const isSnapshotEncrypted = isSyncableItemEncrypted(path.lastId!);
    const snapshots = await docBundle.value.get(trace, SNAPSHOTS_BUNDLE_ID({ encrypted: isSnapshotEncrypted }), 'bundle');
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
          : newDocument({ id: snapshotId, encoded: encodedSnapshot.value as EncodedConflictFreeDocumentSnapshot<PrefixT> })
      ) as DocumentT;

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

      let numAppliedDeltas = 0;
      for (const deltaId of deltaIds.value) {
        // Using a potentially progressively loaded access control document for validating deltas.  If this bundle is itself an access
        // control document, it will be progressively loaded as it's validated
        const deltaFile = await accessControlDocumentProvider(trace, accessControlDoc, (trace) => deltas.value.get(trace, deltaId, 'file'));
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

      return makeSuccess({ document });
    }

    return makeFailure(new NotFoundError(trace, { message: `No valid snapshots found for: ${path.toString()}`, errorCode: 'not-found' }));
  }
);
