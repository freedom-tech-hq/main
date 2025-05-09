import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { RemoteId, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { SyncService } from '../../types/SyncService.ts';

export const pullGlobFromRemote = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: MutableSyncableStore; syncService: SyncService },
    { remoteId, basePath, include, exclude }: { remoteId: RemoteId; basePath: SyncablePath; include: string[]; exclude?: string[] }
  ): PR<undefined, 'not-found'> => {
    // TODO: implement

    return makeSuccess(undefined);
  },
  { deepDisableLam: 'not-found' }
);
