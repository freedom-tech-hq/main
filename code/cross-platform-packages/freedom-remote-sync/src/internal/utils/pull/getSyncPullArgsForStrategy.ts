import { makeAsyncResultFunc, type PR } from 'freedom-async';
import type { SyncablePath, SyncPullArgs } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import type { SyncStrategy } from '../../../types/SyncStrategy.ts';
import { getGlobForStrategy } from '../getGlobForStrategy.ts';
import { getSyncPullArgsForGlob } from './getSyncPullArgsForGlob.ts';

export const getSyncPullArgsForStrategy = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { basePath, strategy }: { basePath: SyncablePath; strategy: SyncStrategy }
  ): PR<SyncPullArgs, 'not-found'> => {
    const glob = getGlobForStrategy(strategy);
    return await getSyncPullArgsForGlob(trace, store, { basePath, glob });
  }
);
