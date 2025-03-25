import type { StaticSyncablePath } from 'freedom-sync-types';

import type { SyncableStoreBacking } from '../../types/backing/SyncableStoreBacking.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SyncTracker } from '../../types/SyncTracker.ts';
import { InMemoryAccessControlledFolderBase } from './InMemoryAccessControlledFolderBase.ts';

// TODO: need to figure out reasonable way of handling partially loaded data, especially for .access-control bundles, since both uploads and downloads are multi-part and async
export class InMemoryAccessControlledFolder extends InMemoryAccessControlledFolderBase {
  constructor({
    store,
    backing,
    syncTracker,
    path
  }: {
    store: WeakRef<MutableSyncableStore>;
    backing: SyncableStoreBacking;
    syncTracker: SyncTracker;
    path: StaticSyncablePath;
  }) {
    super({ backing, syncTracker, path });

    const folderOperationsHandler = this.makeFolderOperationsHandler_(store);
    this.deferredInit_({
      store,
      folderOperationsHandler,
      makeFolderAccessor: () => new InMemoryAccessControlledFolder({ store, backing, path, syncTracker })
    });
  }
}
