import type { PR } from 'freedom-async';
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
import { DefaultFileStoreBase } from './DefaultFileStoreBase.ts';
import { getOrCreateDefaultMutableSyncableFileAccessor } from './DefaultMutableSyncableFileAccessor.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';

export interface DefaultEncryptedFileStoreConstructorArgs {
  store: MutableSyncableStore;
  backing: SyncableStoreBacking;
  syncTracker: SyncTracker;
  folderOperationsHandler: FolderOperationsHandler;
  path: SyncablePath;
}

export class DefaultEncryptedFileStore extends DefaultFileStoreBase {
  constructor({ store, backing, syncTracker, folderOperationsHandler, path }: DefaultEncryptedFileStoreConstructorArgs) {
    super({
      store,
      backing,
      syncTracker,
      folderOperationsHandler,
      path,
      supportsDeletion: true
    });
  }

  // Public Methods

  public toString() {
    return `DefaultEncryptedFileStore(${this.path.toString()})`;
  }

  // DefaultBundleBase Abstract Method Implementations

  // TODO: should cache
  protected override decodeData_(trace: Trace, encodedData: Uint8Array): PR<Uint8Array> {
    DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'decode-data', pathString: this.path.toString() });

    return this.folderOperationsHandler_.verifyAndDecryptBuffer(trace, encodedData);
  }

  protected encodeData_(trace: Trace, rawData: Uint8Array): PR<Uint8Array> {
    DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'encode-data', pathString: this.path.toString() });

    return this.folderOperationsHandler_.encryptAndSignBuffer(trace, rawData);
  }

  protected override makeBundleAccessor_({ path }: { path: SyncablePath }): MutableSyncableBundleAccessor {
    const store = this.weakStore_.deref();
    if (store === undefined) {
      throw new Error('store was released');
    }

    return getOrCreateDefaultEncryptedFileStore({
      store,
      backing: this.backing_,
      syncTracker: this.syncTracker_,
      path,
      folderOperationsHandler: this.folderOperationsHandler_
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
      folderOperationsHandler: this.folderOperationsHandler_,
      decode: (trace, encodedData) => this.decodeData_(trace, encodedData)
    });
  }

  protected override isEncrypted_(): boolean {
    return true;
  }
}

const globalCache = new InMemoryCache<string, DefaultEncryptedFileStore, MutableSyncableStore>({
  cacheDurationMSec: CACHE_DURATION_MSEC,
  shouldResetIntervalOnGet: true
});

export const getOrCreateDefaultEncryptedFileStore = ({
  store,
  backing,
  syncTracker,
  path,
  folderOperationsHandler
}: {
  store: MutableSyncableStore;
  backing: SyncableStoreBacking;
  syncTracker: SyncTracker;
  path: SyncablePath;
  folderOperationsHandler: FolderOperationsHandler;
}) =>
  globalCache.getOrCreate(
    store,
    path.toString(),
    () => new DefaultEncryptedFileStore({ store, backing, syncTracker, path, folderOperationsHandler })
  );
