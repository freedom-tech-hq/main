import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { DynamicSyncablePath, StaticSyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { getSyncableAtPath } from './get/getSyncableAtPath.ts';

export const dynamicToStaticPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    path: DynamicSyncablePath
  ): PR<StaticSyncablePath, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const item = await getSyncableAtPath(trace, store, path);
    if (!item.ok) {
      return item;
    }

    return makeSuccess(item.value.path);
  }
);
