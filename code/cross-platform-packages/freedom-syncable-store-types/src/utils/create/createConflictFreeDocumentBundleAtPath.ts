import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { ConflictFreeDocument } from 'freedom-conflict-free-document';
import { type Trace } from 'freedom-contexts';
import type { DynamicSyncableItemName, SyncableOriginOptions, SyncablePath } from 'freedom-sync-types';
import { isSyncableItemEncrypted, timeId } from 'freedom-sync-types';

import { makeDeltasBundleId, SNAPSHOTS_BUNDLE_ID } from '../../consts/special-file-ids.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { createBundleAtPath } from './createBundleAtPath.ts';
import { createStringFileAtPath } from './createStringFileAtPath.ts';

export const createConflictFreeDocumentBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async <PrefixT extends string, DocumentT extends ConflictFreeDocument<PrefixT>>(
    trace: Trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    {
      name,
      trustedTimeSignature,
      newDocument
    }: Partial<SyncableOriginOptions> & {
      newDocument: () => DocumentT;
      name?: DynamicSyncableItemName;
    }
  ): PR<undefined, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const docBundle = await createBundleAtPath(trace, store, path, { name, trustedTimeSignature });
    /* node:coverage disable */
    if (!docBundle.ok) {
      return docBundle;
    }
    /* node:coverage enable */
    const docPath = docBundle.value.path;

    // Snapshots are encrypted if their parent bundle is encrypted
    const isEncrypted = isSyncableItemEncrypted(docPath.lastId!);
    const snapshots = await docBundle.value.createBundle(trace, {
      id: SNAPSHOTS_BUNDLE_ID({ encrypted: isEncrypted }),
      trustedTimeSignature: undefined
    });
    /* node:coverage disable */
    if (!snapshots.ok) {
      return snapshots;
    }
    /* node:coverage enable */
    const snapshotsPath = snapshots.value.path;

    const initialSnapshotId = timeId({ encrypted: isEncrypted, type: 'file' });

    const deltas = await docBundle.value.createBundle(trace, {
      id: makeDeltasBundleId({ encrypted: isEncrypted }, initialSnapshotId),
      trustedTimeSignature: undefined
    });
    /* node:coverage disable */
    if (!deltas.ok) {
      return deltas;
    }
    /* node:coverage enable */

    const document = newDocument();
    const encodedSnapshot = document.encodeSnapshot(initialSnapshotId);

    const savedSnapshot = await createStringFileAtPath(trace, store, snapshotsPath.append(initialSnapshotId), {
      name: initialSnapshotId,
      value: encodedSnapshot
    });
    /* node:coverage disable */
    if (!savedSnapshot.ok) {
      // Conflicts shouldn't happen since we're using a UUID for the snapshot ID
      return generalizeFailureResult(trace, savedSnapshot, 'conflict');
    }
    /* node:coverage enable */

    return makeSuccess(undefined);
  }
);
