import { makeAsyncResultFunc, type PR } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { pushToLocal } from 'freedom-local-sync';
import type { PullOutOfSyncBundle, RemoteId, SyncablePath } from 'freedom-sync-types';
import { type MutableSyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../../types/RemoteSyncService.ts';
import { enqueueFollowUpSyncsIfNeeded } from './enqueueFollowUpSyncsIfNeeded.ts';

export const pushBundleToLocal = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    { store, syncService, bundle }: { store: MutableSyncableStore; syncService: RemoteSyncService; bundle: PullOutOfSyncBundle },
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined, 'not-found'> => {
    const pushedToLocal = await pushToLocal(trace, store, {
      basePath: path,
      item: { metadata: bundle.metadata, itemsById: bundle.itemsById }
    });
    if (!pushedToLocal.ok) {
      return pushedToLocal;
    }

    return await enqueueFollowUpSyncsIfNeeded(trace, { store, syncService, item: bundle }, { remoteId, path });
  }
);
