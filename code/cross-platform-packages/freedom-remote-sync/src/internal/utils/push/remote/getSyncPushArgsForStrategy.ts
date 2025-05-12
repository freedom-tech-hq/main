import { makeAsyncResultFunc, type PR } from 'freedom-async';
import type { RemoteId, SyncablePath, SyncPushArgs } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../../types/RemoteSyncService.ts';
import type { SyncStrategy } from '../../../../types/SyncStrategy.ts';
import { getGlobForStrategy } from '../../getGlobForStrategy.ts';
import { getSyncPushArgsForGlob } from './getSyncPushArgsForGlob.ts';

export const getSyncPushArgsForStrategy = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: RemoteSyncService },
    { remoteId, basePath, strategy }: { remoteId: RemoteId; basePath: SyncablePath; strategy: SyncStrategy }
  ): PR<SyncPushArgs, 'not-found'> => {
    const glob = getGlobForStrategy(strategy);
    return await getSyncPushArgsForGlob(trace, { store, syncService }, { remoteId, basePath, glob });
  }
);
