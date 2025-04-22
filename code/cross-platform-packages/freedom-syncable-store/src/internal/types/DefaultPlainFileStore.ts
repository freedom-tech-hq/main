import type { PR } from 'freedom-async';
import { makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableBundleAccessor, MutableSyncableFileAccessor } from 'freedom-syncable-store-types';

import type { DefaultFileStoreBaseConstructorArgs } from './DefaultFileStoreBase.ts';
import { DefaultFileStoreBase } from './DefaultFileStoreBase.ts';
import { DefaultMutableSyncableFileAccessor } from './DefaultMutableSyncableFileAccessor.ts';

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
    return new DefaultPlainFileStore({
      store: this.weakStore_,
      backing: this.backing_,
      syncTracker: this.syncTracker_,
      path,
      folderOperationsHandler: this.folderOperationsHandler_,
      supportsDeletion: this.supportsDeletion
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
    return false;
  }
}
