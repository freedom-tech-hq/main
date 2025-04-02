import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';
import type { TrustedTimeSource } from 'freedom-trusted-time-source';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { getFolderPath } from './get/getFolderPath.ts';
import { getSyncableAtPath } from './get/getSyncableAtPath.ts';

export const getTrustedTimeSourcesForPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    path: SyncablePath
  ): PR<TrustedTimeSource[], 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const nearestFolderPath = await getFolderPath(trace, store, path);
    if (!nearestFolderPath.ok) {
      return nearestFolderPath;
    }

    const itemAccessor = await getSyncableAtPath(trace, store, nearestFolderPath.value, 'folder');
    if (!itemAccessor.ok) {
      return itemAccessor;
    }

    return await itemAccessor.value.getTrustedTimeSources(trace);
  }
);
