import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import { extractSyncableItemTypeFromId, type SyncablePath } from 'freedom-sync-types';
import type { ISyncableStoreAccessControlDocument, SyncableStore } from 'freedom-syncable-store-types';

import { getNearestFolder } from './getNearestFolder.ts';

/** Gets the access control document that grants permission over the specified item */
export const getOwningAccessControlDocument = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: SyncablePath): PR<ISyncableStoreAccessControlDocument, 'not-found'> => {
    if (path.ids.length === 0) {
      return makeFailure(new InternalStateError(trace, { message: `${import.meta.filename} shouldn't be used with roots` }));
    }

    // Folders are owned by the access control documents of their nearest parent folders
    if (extractSyncableItemTypeFromId(path.lastId!) === 'folder') {
      path = path.parentPath!;
    }

    const nearestFolder = await getNearestFolder(trace, store, path);
    if (!nearestFolder.ok) {
      return generalizeFailureResult(trace, nearestFolder, ['not-found', 'untrusted', 'wrong-type']);
    }

    const accessControlDoc = await nearestFolder.value.getAccessControlDocument(trace);
    if (!accessControlDoc.ok) {
      return accessControlDoc;
    }

    return makeSuccess(accessControlDoc.value);
  }
);
