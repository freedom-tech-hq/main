import { InMemoryCache } from 'freedom-in-memory-cache';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStoreBacking } from 'freedom-syncable-store-backing-types';
import type { MutableSyncableStore, SyncTracker } from 'freedom-syncable-store-types';

import { CACHE_DURATION_MSEC } from '../consts/timing.ts';
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

    this.deferredDefaultMutableSyncableFolderAccessorBaseInit_({
      store,
      makeFolderAccessor: ({ path }) => getOrCreateDefaultMutableSyncableFolderAccessor({ store, backing, path, syncTracker })
    });
  }

  public toString() {
    return `Folder(${this.path.toString()})`;
  }
}

const globalCache = new InMemoryCache<string, DefaultMutableSyncableFolderAccessor, MutableSyncableStore>({
  cacheDurationMSec: CACHE_DURATION_MSEC,
  shouldResetIntervalOnGet: true
});

export const getOrCreateDefaultMutableSyncableFolderAccessor = ({
  store,
  backing,
  syncTracker,
  path
}: {
  store: MutableSyncableStore;
  backing: SyncableStoreBacking;
  syncTracker: SyncTracker;
  path: SyncablePath;
}) =>
  globalCache.getOrCreate(store, path.toString(), () => new DefaultMutableSyncableFolderAccessor({ store, backing, path, syncTracker }));
