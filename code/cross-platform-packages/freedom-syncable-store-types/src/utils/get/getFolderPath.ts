import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { SyncablePath } from 'freedom-sync-types';
import { DynamicSyncablePath, StaticSyncablePath } from 'freedom-sync-types';

import type { StoreBase } from '../../types/StoreBase.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

/** If this path represents a file, returns a new path with the deepest common folder.  If this path represents a folder, returns the
 * same path */
export const getFolderPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: SyncablePath): PR<StaticSyncablePath, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    if (path.ids.length === 0) {
      return makeSuccess(new StaticSyncablePath(path.storageRootId));
    }

    if (store.path.storageRootId !== path.storageRootId) {
      return makeFailure(new NotFoundError(trace, { message: 'Wrong storage root ID', errorCode: 'not-found' }));
    }

    let lastOkPath = store.path;
    let cursor: StoreBase = store;

    if (path instanceof DynamicSyncablePath) {
      const item = await getSyncableAtPath(trace, store, path);
      if (!item.ok) {
        return item;
      }

      path = item.value.path;
    }

    for (const id of path.ids) {
      const nextCursor = await cursor.get(trace, id);
      if (!nextCursor.ok) {
        return nextCursor;
      }

      switch (nextCursor.value.type) {
        case 'folder': {
          lastOkPath = nextCursor.value.path;
          cursor = nextCursor.value;
          break;
        }
        case 'bundle':
        case 'file':
          return makeSuccess(lastOkPath);
      }
    }

    return makeSuccess(lastOkPath);
  }
);
