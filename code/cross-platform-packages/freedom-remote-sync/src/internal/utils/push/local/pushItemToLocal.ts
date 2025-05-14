import { makeAsyncResultFunc, type PR } from 'freedom-async';
import type { PullOutOfSyncFile, PullOutOfSyncFolderLikeItem, PullOutOfSyncItem, RemoteId, SyncablePath } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../../types/RemoteSyncService.ts';
import { pushFileToLocal } from './pushFileToLocal.ts';
import { pushFolderLikeItemToLocal } from './pushFolderLikeItemToLocal.ts';

export const pushItemToLocal = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService, item }: { store: MutableSyncableStore; syncService: RemoteSyncService; item: PullOutOfSyncItem },
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined, 'not-found'> => {
    const baseItemType = extractSyncableItemTypeFromPath(path);
    switch (baseItemType) {
      case 'folder':
      case 'bundle':
        return await pushFolderLikeItemToLocal(
          trace,
          { store, syncService, folderLike: item as PullOutOfSyncFolderLikeItem },
          { remoteId, path }
        );

      case 'file':
        return await pushFileToLocal(trace, { store, file: item as PullOutOfSyncFile }, { path });
    }
  }
);
