import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';
import type { TrustedTimeSource } from 'freedom-trusted-time-source';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { getNearestFolderPath } from './get/getNearestFolderPath.ts';
import { getSyncableAtPath } from './get/getSyncableAtPath.ts';

export const getTrustedTimeSourcesForPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    path: SyncablePath
  ): PR<TrustedTimeSource[], 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const nearestFolderPath = await getNearestFolderPath(trace, store, path);
    if (!nearestFolderPath.ok) {
      return nearestFolderPath;
    }

    const nearestFolder = await getSyncableAtPath(trace, store, nearestFolderPath.value, 'folder');
    if (!nearestFolder.ok) {
      return nearestFolder;
    }

    return await nearestFolder.value.getTrustedTimeSources(trace);
  }
);
