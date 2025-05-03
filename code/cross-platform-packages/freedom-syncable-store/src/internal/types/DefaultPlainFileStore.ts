import type { PR } from 'freedom-async';
import { makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { InMemoryCache } from 'freedom-in-memory-cache';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStoreBacking } from 'freedom-syncable-store-backing-types';
import type {
  MutableSyncableBundleAccessor,
  MutableSyncableFileAccessor,
  MutableSyncableStore,
  SyncTracker
} from 'freedom-syncable-store-types';

import { CACHE_DURATION_MSEC } from '../consts/timing.ts';
import type { DefaultFileStoreBaseConstructorArgs } from './DefaultFileStoreBase.ts';
import { DefaultFileStoreBase } from './DefaultFileStoreBase.ts';
import { getOrCreateDefaultMutableSyncableFileAccessor } from './DefaultMutableSyncableFileAccessor.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';

export type DefaultPlainFileStoreConstructorArgs = DefaultFileStoreBaseConstructorArgs;

export class DefaultPlainFileStore extends DefaultFileStoreBase {
  // Public Methods

  public toString() {
    return `DefaultPlainFileStore(${this.path.toString()})`;
  }

  // DefaultBundleBase Abstract Method Implementations

  protected override async decodeData_(_trace: Trace, encodedData: Uint8Array): PR<Uint8Array> {
    // No change needed for plain data
    return makeSuccess(encodedData);
  }

  protected override async encodeData_(_trace: Trace, rawData: Uint8Array): PR<Uint8Array> {
    // No change needed for plain data
    return makeSuccess(rawData);
  }

  protected override makeBundleAccessor_({ path }: { path: SyncablePath }): MutableSyncableBundleAccessor {
    const store = this.weakStore_.deref();
    if (store === undefined) {
      throw new Error('store was released');
    }

    return getOrCreateDefaultPlainFileStore({
      store,
      backing: this.backing_,
      syncTracker: this.syncTracker_,
      path,
      folderOperationsHandler: this.folderOperationsHandler_,
      supportsDeletion: this.supportsDeletion
    });
  }

  protected override makeFileAccessor_({ path }: { path: SyncablePath }): MutableSyncableFileAccessor {
    const store = this.weakStore_.deref();
    if (store === undefined) {
      throw new Error('store was released');
    }

    return getOrCreateDefaultMutableSyncableFileAccessor({
      store,
      backing: this.backing_,
      path,
      decode: (trace, encodedData) => this.decodeData_(trace, encodedData)
    });
  }

  protected override isEncrypted_(): boolean {
    return false;
  }
}

const globalCache = new InMemoryCache<string, DefaultPlainFileStore, MutableSyncableStore>({
  cacheDurationMSec: CACHE_DURATION_MSEC,
  shouldResetIntervalOnGet: true
});

export const getOrCreateDefaultPlainFileStore = ({
  store,
  backing,
  syncTracker,
  path,
  folderOperationsHandler,
  supportsDeletion
}: {
  store: MutableSyncableStore;
  backing: SyncableStoreBacking;
  syncTracker: SyncTracker;
  path: SyncablePath;
  folderOperationsHandler: FolderOperationsHandler;
  supportsDeletion: boolean;
}) =>
  globalCache.getOrCreate(
    store,
    path.toString(),
    () => new DefaultPlainFileStore({ store, backing, syncTracker, path, folderOperationsHandler, supportsDeletion })
  );
