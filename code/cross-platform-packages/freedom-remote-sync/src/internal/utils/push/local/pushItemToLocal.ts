import { makeAsyncResultFunc, type PR } from 'freedom-async';
import { pushToLocal } from 'freedom-local-sync';
import type {
  PullOutOfSyncBundle,
  PullOutOfSyncFile,
  PullOutOfSyncFolder,
  PullOutOfSyncItem,
  RemoteId,
  SyncablePath
} from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../../types/RemoteSyncService.ts';
import { pushBundleToLocal } from './pushBundleToLocal.ts';
import { pushFolderToLocal } from './pushFolderToLocal.ts';

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
        return await pushFolderToLocal(trace, { store, syncService, folder: item as PullOutOfSyncFolder }, { remoteId, path });

      case 'file': {
        const file = item as PullOutOfSyncFile;
        return await pushToLocal(trace, store, { basePath: path, item: { metadata: file.metadata, data: file.data } });
      }

      case 'bundle':
        return await pushBundleToLocal(trace, { store, syncService, bundle: item as PullOutOfSyncBundle }, { remoteId, path });
    }
  }
);
