import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';
import type { TrustedTimeSource } from 'freedom-trusted-time-source';

import { getNearestFolder } from './get/getNearestFolder.ts';

export const getTrustedTimeSourcesForPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    path: SyncablePath
  ): PR<TrustedTimeSource[], 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const nearestFolder = await getNearestFolder(trace, store, path);
    if (!nearestFolder.ok) {
      return nearestFolder;
    }

    return await nearestFolder.value.getTrustedTimeSources(trace);
  }
);
