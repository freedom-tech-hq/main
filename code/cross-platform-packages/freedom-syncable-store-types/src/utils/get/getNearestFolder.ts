import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';

import type { SyncableFolderAccessor } from '../../types/SyncableFolderAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getNearestFolderPath } from './getNearestFolderPath.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

export const getNearestFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    path: SyncablePath
  ): PR<SyncableFolderAccessor, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const nearestFolderPath = await getNearestFolderPath(trace, store, path);
    if (!nearestFolderPath.ok) {
      return nearestFolderPath;
    }

    return await getSyncableAtPath(trace, store, nearestFolderPath.value, 'folder');
  }
);
