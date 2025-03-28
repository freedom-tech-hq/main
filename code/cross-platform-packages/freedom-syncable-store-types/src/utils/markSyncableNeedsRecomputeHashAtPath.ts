import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { OldSyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { getSyncableAtPath } from './get/getSyncableAtPath.ts';

export const markSyncableNeedsRecomputeHashAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: OldSyncablePath): PR<undefined, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const itemAccessor = await getSyncableAtPath(trace, store, path);
    if (!itemAccessor.ok) {
      return itemAccessor;
    }

    return await itemAccessor.value.markNeedsRecomputeHash(trace);
  }
);
