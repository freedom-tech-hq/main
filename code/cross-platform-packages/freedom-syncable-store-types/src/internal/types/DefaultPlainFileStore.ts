import type { PR } from 'freedom-async';
import { makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import { generateSha256HashFromBuffer } from 'freedom-crypto';
import type { StaticSyncablePath } from 'freedom-sync-types';

import type { MutableSyncableBundleAccessor } from '../../types/MutableSyncableBundleAccessor.ts';
import type { MutableSyncableFlatFileAccessor } from '../../types/MutableSyncableFlatFileAccessor.ts';
import type { DefaultFileStoreBaseConstructorArgs } from './DefaultFileStoreBase.ts';
import { DefaultFileStoreBase } from './DefaultFileStoreBase.ts';
import { DefaultMutableSyncableFlatFileAccessor } from './DefaultMutableSyncableFlatFileAccessor.ts';

export type DefaultPlainFileStoreConstructorArgs = DefaultFileStoreBaseConstructorArgs;

export class DefaultPlainFileStore extends DefaultFileStoreBase {
  // DefaultBundleBase Abstract Method Implementations

  protected override computeHash_(trace: Trace, encodedData: Uint8Array): PR<Sha256Hash> {
    return generateSha256HashFromBuffer(trace, encodedData);
  }

  protected override async decodeData_(_trace: Trace, encodedData: Uint8Array): PR<Uint8Array> {
    // No change needed for plain data
    return makeSuccess(encodedData);
  }

  protected override async encodeData_(_trace: Trace, rawData: Uint8Array): PR<Uint8Array> {
    // No change needed for plain data
    return makeSuccess(rawData);
  }

  protected override makeBundleAccessor_({ path }: { path: StaticSyncablePath }): MutableSyncableBundleAccessor {
    return new DefaultPlainFileStore({
      store: this.weakStore_,
      backing: this.backing_,
      syncTracker: this.syncTracker_,
      path,
      folderOperationsHandler: this.folderOperationsHandler_,
      supportsDeletion: this.supportsDeletion
    });
  }

  protected override makeFlatFileAccessor_({ path }: { path: StaticSyncablePath }): MutableSyncableFlatFileAccessor {
    return new DefaultMutableSyncableFlatFileAccessor({
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
