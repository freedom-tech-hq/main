import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { SyncService } from '../../types/SyncService.ts';

export const makeManualSyncFunc = (syncService: SyncService, store: MutableSyncableStore) =>
  makeAsyncResultFunc([import.meta.filename], async (trace: Trace): PR<undefined> => {
    const rootHash = await store.getHash(trace);
    if (!rootHash.ok) {
      return rootHash;
    }

    syncService.pullFromRemotes({ path: store.path, hash: rootHash.value });
    syncService.pushToRemotes({ path: store.path, hash: rootHash.value });

    return makeSuccess(undefined);
  });
