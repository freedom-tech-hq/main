import { makeAsyncResultFunc, type PR } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { pushToLocal } from 'freedom-local-sync';
import type { PullOutOfSyncFolderLikeItem, RemoteId, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../../types/RemoteSyncService.ts';
import { enqueueFollowUpSyncsIfNeeded } from './enqueueFollowUpSyncsIfNeeded.ts';

export const pushFolderLikeItemToLocal = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    {
      store,
      syncService,
      folderLike
    }: { store: MutableSyncableStore; syncService: RemoteSyncService; folderLike: PullOutOfSyncFolderLikeItem },
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined, 'not-found'> => {
    const pushedToLocal = await pushToLocal(trace, store, {
      basePath: path,
      item: { metadata: folderLike.metadata, itemsById: folderLike.itemsById }
    });
    if (!pushedToLocal.ok) {
      return pushedToLocal;
    }

    return await enqueueFollowUpSyncsIfNeeded(trace, { store, syncService, item: folderLike }, { remoteId, path });
  }
);
