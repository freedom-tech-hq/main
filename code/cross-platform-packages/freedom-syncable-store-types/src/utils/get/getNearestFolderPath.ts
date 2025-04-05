import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import { extractSyncableItemTypeFromId, SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../../types/SyncableStore.ts';

/** If this path represents a file, returns a new path with the deepest common folder.  If this path represents a folder, returns the
 * same path */
export const getNearestFolderPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: SyncablePath): PR<SyncablePath, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    if (store.path.storageRootId !== path.storageRootId) {
      return makeFailure(new NotFoundError(trace, { message: 'Wrong storage root ID', errorCode: 'not-found' }));
    }

    if (path.lastId !== undefined && extractSyncableItemTypeFromId(path.lastId) === 'folder') {
      return makeSuccess(path);
    }

    const numIds = path.ids.length;
    for (let index = numIds - 1; index >= 0; index -= 1) {
      if (extractSyncableItemTypeFromId(path.ids[index]) === 'folder') {
        return makeSuccess(new SyncablePath(path.storageRootId, ...path.ids.slice(0, index + 1)));
      }
    }

    return makeSuccess(new SyncablePath(path.storageRootId));
  }
);
