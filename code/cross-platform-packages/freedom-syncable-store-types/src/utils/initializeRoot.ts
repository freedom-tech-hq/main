import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

import type { MutableSyncableStore } from '../types/MutableSyncableStore.ts';

export const initializeRoot = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace: Trace, store: MutableSyncableStore): PR<MutableSyncableStore, 'conflict' | 'not-found'> => {
    const accessInitialized = await store.initialize(trace);
    if (!accessInitialized.ok) {
      return accessInitialized;
    }

    return makeSuccess(store);
  }
);
