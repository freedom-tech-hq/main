import type { PR } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncablePath } from 'freedom-sync-types';

import type { SyncableStoreBacking } from '../../types/backing/SyncableStoreBacking.ts';
import type { MutableSyncableBundleAccessor } from '../../types/MutableSyncableBundleAccessor.ts';
import type { MutableSyncableFileAccessor } from '../../types/MutableSyncableFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SyncTracker } from '../../types/SyncTracker.ts';
import { DefaultFileStoreBase } from './DefaultFileStoreBase.ts';
import { DefaultMutableSyncableFileAccessor } from './DefaultMutableSyncableFileAccessor.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';

export interface DefaultEncryptedFileStoreConstructorArgs {
  store: WeakRef<MutableSyncableStore>;
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

  protected override decodeData_(trace: Trace, encodedData: Uint8Array): PR<Uint8Array> {
    DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'decode-data', pathString: this.path.toString() });

    return this.folderOperationsHandler_.verifyAndDecryptBuffer(trace, encodedData);
  }

  protected encodeData_(trace: Trace, rawData: Uint8Array): PR<Uint8Array> {
    DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'encode-data', pathString: this.path.toString() });

    return this.folderOperationsHandler_.encryptAndSignBuffer(trace, rawData);
  }

  protected override makeBundleAccessor_({ path }: { path: SyncablePath }): MutableSyncableBundleAccessor {
    return new DefaultEncryptedFileStore({
      store: this.weakStore_,
      backing: this.backing_,
      syncTracker: this.syncTracker_,
      folderOperationsHandler: this.folderOperationsHandler_,
      path
    });
  }

  protected override makeFileAccessor_({ path }: { path: SyncablePath }): MutableSyncableFileAccessor {
    return new DefaultMutableSyncableFileAccessor({
      store: this.weakStore_,
      backing: this.backing_,
      path,
      decode: (trace, encodedData) => this.decodeData_(trace, encodedData)
    });
  }

  protected override isEncrypted_(): boolean {
    return true;
  }
}
