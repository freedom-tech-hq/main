import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import { extractSyncableItemTypeFromId, type SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import type { SyncableStoreAccessControlDocument } from '../../types/SyncableStoreAccessControlDocument.ts';
import { getFolderAtPath } from './getFolderAtPath.ts';
import { getNearestFolderPath } from './getNearestFolderPath.ts';

/** Gets the access control document that grants permission over the specified item */
export const getOwningAccessControlDocument = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: SyncablePath): PR<SyncableStoreAccessControlDocument, 'not-found'> => {
    if (path.ids.length === 0) {
      return makeFailure(new InternalStateError(trace, { message: `${import.meta.filename} shouldn't be used with roots` }));
    }

    // Folders are owned by the access control documents of their nearest parent folders
    if (extractSyncableItemTypeFromId(path.lastId!) === 'folder') {
      path = path.parentPath!;
    }

    const nearestFolderPath = await getNearestFolderPath(trace, store, path);
    if (!nearestFolderPath.ok) {
      return generalizeFailureResult(trace, nearestFolderPath, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const nearestFolder = await getFolderAtPath(trace, store, nearestFolderPath.value);
    if (!nearestFolder.ok) {
      return generalizeFailureResult(trace, nearestFolder, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const accessControlDoc = await nearestFolder.value.getAccessControlDocument(trace);
    if (!accessControlDoc.ok) {
      return accessControlDoc;
    }

    return makeSuccess(accessControlDoc.value);
  }
);
