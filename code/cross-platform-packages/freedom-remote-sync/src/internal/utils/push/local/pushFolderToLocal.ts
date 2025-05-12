import { bestEffort, makeAsyncResultFunc, type PR } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { pushToLocal } from 'freedom-local-sync';
import type { PullOutOfSyncFolder, RemoteId, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import type { RemoteSyncService } from '../../../../types/RemoteSyncService.ts';
import { enqueueFollowUpSyncsIfNeeded } from './enqueueFollowUpSyncsIfNeeded.ts';
import { pullAccessControlBundleForFolder } from './pullAccessControlBundleForFolder.ts';

export const pushFolderToLocal = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    { store, syncService, folder }: { store: MutableSyncableStore; syncService: RemoteSyncService; folder: PullOutOfSyncFolder },
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined, 'not-found'> => {
    const pushedToLocal = await pushToLocal(trace, store, {
      basePath: path,
      item: { metadata: folder.metadata, itemsById: folder.itemsById }
    });
    if (!pushedToLocal.ok) {
      return pushedToLocal;
    }

    // When a folder is pulled, we always want to make sure we immediately have the access control bundle as well
    // This may fail with not-found if the folder wasn't completely synced to the remote (for example immediately after remote registration
    // when only the root exists)
    await bestEffort(
      trace,
      disableLam('not-found', pullAccessControlBundleForFolder)(trace, { store, syncService }, { remoteId, folderPath: path })
    );

    return await enqueueFollowUpSyncsIfNeeded(trace, { store, syncService, item: folder }, { remoteId, path });
  }
);
