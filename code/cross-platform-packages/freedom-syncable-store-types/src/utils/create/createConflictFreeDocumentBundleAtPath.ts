import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import { makeUuid, type Trace } from 'freedom-contexts';
import { generateSha256HashForEmptyString, generateSha256HashFromString } from 'freedom-crypto';
import type { DynamicSyncableId, StaticSyncablePath, SyncablePath } from 'freedom-sync-types';
import { timeId } from 'freedom-sync-types';

import { makeDeltasBundleFileId, SNAPSHOTS_BUNDLE_FILE_ID } from '../../consts/special-file-ids.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SaveableDocument } from '../../types/SaveableDocument.ts';
import { getBundleFileAtPath } from '../get/getBundleFileAtPath.ts';
import { createBundleFileAtPath } from './createBundleFileAtPath.ts';
import { createStringFileAtPath } from './createStringFileAtPath.ts';

export const createConflictFreeDocumentBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>>(
    trace: Trace,
    store: MutableSyncableStore,
    parentPath: SyncablePath,
    id: DynamicSyncableId,
    { newDocument }: { newDocument: (snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<PrefixT> }) => DocumentT }
  ): PR<SaveableDocument<DocumentT> & { path: StaticSyncablePath }, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const docBundle = await createBundleFileAtPath(trace, store, parentPath, id);
    /* node:coverage disable */
    if (!docBundle.ok) {
      return docBundle;
    }
    /* node:coverage enable */
    const path = docBundle.value.path;

    const snapshots = await createBundleFileAtPath(trace, store, path, SNAPSHOTS_BUNDLE_FILE_ID);
    /* node:coverage disable */
    if (!snapshots.ok) {
      return snapshots;
    }
    /* node:coverage enable */
    const snapshotsPath = snapshots.value.path;

    const initialSnapshotId = await snapshots.value.generateNewSyncableItemId(trace, {
      id: timeId(makeUuid()),
      parentPath: snapshotsPath,
      getSha256ForItemProvenance: generateSha256HashForEmptyString
    });
    if (!initialSnapshotId.ok) {
      return initialSnapshotId;
    }

    const deltas = await createBundleFileAtPath(trace, store, path, makeDeltasBundleFileId(initialSnapshotId.value));
    /* node:coverage disable */
    if (!deltas.ok) {
      return deltas;
    }
    /* node:coverage enable */

    const document = newDocument();
    const encodedSnapshot = document.encodeSnapshot(initialSnapshotId.value);

    const savedSnapshot = await createStringFileAtPath(trace, store, snapshotsPath, initialSnapshotId.value, encodedSnapshot);
    /* node:coverage disable */
    if (!savedSnapshot.ok) {
      // Conflicts shouldn't happen since we're using a UUID for the snapshot ID
      return generalizeFailureResult(trace, savedSnapshot, 'conflict');
    }
    /* node:coverage enable */

    return makeSuccess({
      document,
      path,
      save: makeAsyncResultFunc([import.meta.filename, 'save'], async (trace): PR<undefined, 'conflict'> => {
        if (document.snapshotId === undefined) {
          return makeFailure(new NotFoundError(trace, { message: 'No snapshot ID is set' }));
        }

        const deltasPath = path.append(makeDeltasBundleFileId(document.snapshotId));
        const deltas = await getBundleFileAtPath(trace, store, deltasPath);
        if (!deltas.ok) {
          return generalizeFailureResult(trace, deltas, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
        }

        const encodedDelta = document.encodeDelta();

        const deltaId = await deltas.value.generateNewSyncableItemId(trace, {
          id: timeId(makeUuid()),
          parentPath: deltasPath,
          getSha256ForItemProvenance: (trace) => generateSha256HashFromString(trace, encodedDelta)
        });
        if (!deltaId.ok) {
          return deltaId;
        }

        const savedDelta = await createStringFileAtPath(trace, store, deltasPath, deltaId.value, encodedDelta);
        /* node:coverage disable */
        if (!savedDelta.ok) {
          // Conflicts shouldn't happen since we're using a UUID for the delta ID
          return generalizeFailureResult(trace, savedDelta, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
        }
        /* node:coverage enable */

        return makeSuccess(undefined);
      })
    });
  }
);
