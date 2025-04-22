import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStoreBacking } from 'freedom-syncable-store-backing-types';
import type { MutableSyncableStore, SyncTracker } from 'freedom-syncable-store-types';

import { DefaultMutableSyncableFolderAccessorBase } from './DefaultMutableSyncableFolderAccessorBase.ts';

// TODO: need to figure out reasonable way of handling partially loaded data, especially for .access-control bundles, since both uploads and downloads are multi-part and async
export class DefaultMutableSyncableFolderAccessor extends DefaultMutableSyncableFolderAccessorBase {
  constructor({
    store,
    backing,
    syncTracker,
    path
  }: {
    store: MutableSyncableStore;
    backing: SyncableStoreBacking;
    syncTracker: SyncTracker;
    path: SyncablePath;
  }) {
    super({ backing, syncTracker, path });

    this.deferredInit_({
      store,
      makeFolderAccessor: ({ path }) => new DefaultMutableSyncableFolderAccessor({ store, backing, path, syncTracker })
    });
  }

  public toString() {
    return `Folder(${this.path.toString()})`;
  }
}
