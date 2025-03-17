import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { getSyncableAtPath } from './get/getSyncableAtPath.ts';

export const markSyncableNeedsRecomputeHashAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: SyncablePath): PR<undefined, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const itemAccessor = await getSyncableAtPath(trace, store, path);
    if (!itemAccessor.ok) {
      return itemAccessor;
    }

    return itemAccessor.value.markNeedsRecomputeHash(trace);
  }
);
