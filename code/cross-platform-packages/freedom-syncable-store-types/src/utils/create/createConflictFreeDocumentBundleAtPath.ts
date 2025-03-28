import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import { makeUuid, type Trace } from 'freedom-contexts';
import { type DynamicSyncableItemName, extractSyncableIdParts, type SyncablePath, timeName, uuidId } from 'freedom-sync-types';

import { makeDeltasBundleId, SNAPSHOTS_BUNDLE_ID } from '../../consts/special-file-ids.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SaveableDocument } from '../../types/SaveableDocument.ts';
import { getBundleAtPath } from '../get/getBundleAtPath.ts';
import { createBundleAtPath } from './createBundleAtPath.ts';
import { createStringFileAtPath } from './createStringFileAtPath.ts';

// TODO: all of these atPath functions are now confusing since id is optional, revisit
export const createConflictFreeDocumentBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>>(
    trace: Trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    {
      name,
      newDocument
    }: {
      name?: DynamicSyncableItemName;
      newDocument: (snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<PrefixT> }) => DocumentT;
    }
  ): PR<SaveableDocument<DocumentT> & { path: SyncablePath }, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const docBundle = await createBundleAtPath(trace, store, path, { name });
    /* node:coverage disable */
    if (!docBundle.ok) {
      return docBundle;
    }
    /* node:coverage enable */
    const docPath = docBundle.value.path;

    // Snapshots are encrypted if their parent bundle is encrypted
    const isEncrypted = extractSyncableIdParts(docPath.lastId!).encrypted;
    const snapshots = await createBundleAtPath(trace, store, docPath.append(SNAPSHOTS_BUNDLE_ID({ encrypted: isEncrypted })), {});
    /* node:coverage disable */
    if (!snapshots.ok) {
      return snapshots;
    }
    /* node:coverage enable */
    const snapshotsPath = snapshots.value.path;

    const initialSnapshotId = uuidId({ encrypted: isEncrypted, type: 'file' });

    const deltas = await createBundleAtPath(
      trace,
      store,
      docPath.append(makeDeltasBundleId({ encrypted: isEncrypted }, initialSnapshotId)),
      {}
    );
    /* node:coverage disable */
    if (!deltas.ok) {
      return deltas;
    }
    /* node:coverage enable */

    const document = newDocument();
    const encodedSnapshot = document.encodeSnapshot(initialSnapshotId);

    const savedSnapshot = await createStringFileAtPath(trace, store, snapshotsPath.append(initialSnapshotId), {
      name: timeName(makeUuid()),
      value: encodedSnapshot
    });
    /* node:coverage disable */
    if (!savedSnapshot.ok) {
      // Conflicts shouldn't happen since we're using a UUID for the snapshot ID
      return generalizeFailureResult(trace, savedSnapshot, 'conflict');
    }
    /* node:coverage enable */

    return makeSuccess({
      document,
      path: docPath,
      save: makeAsyncResultFunc([import.meta.filename, 'save'], async (trace): PR<undefined, 'conflict'> => {
        if (document.snapshotId === undefined) {
          return makeFailure(new NotFoundError(trace, { message: 'No snapshot ID is set' }));
        }

        // Deltas are encrypted if their parent bundle is encrypted
        const areDeltasEncrypted = extractSyncableIdParts(docPath.lastId!).encrypted;
        const deltasPath = docPath.append(makeDeltasBundleId({ encrypted: areDeltasEncrypted }, document.snapshotId));
        const deltas = await getBundleAtPath(trace, store, deltasPath);
        if (!deltas.ok) {
          return generalizeFailureResult(trace, deltas, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
        }

        const encodedDelta = document.encodeDelta();

        const savedDelta = await createStringFileAtPath(
          trace,
          store,
          deltasPath.append(uuidId({ encrypted: areDeltasEncrypted, type: 'file' })),
          {
            name: timeName(makeUuid()),
            value: encodedDelta
          }
        );
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
