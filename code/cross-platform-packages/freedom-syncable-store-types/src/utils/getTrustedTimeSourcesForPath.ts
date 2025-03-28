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
    const parentFolderPath = await getFolderPath(trace, store, path);
    if (!parentFolderPath.ok) {
      return parentFolderPath;
    }

    const itemAccessor = await getSyncableAtPath(trace, store, parentFolderPath.value, 'folder');
    if (!itemAccessor.ok) {
      return itemAccessor;
    }

    return await itemAccessor.value.getTrustedTimeSources(trace);
  }
);
