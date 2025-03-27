import type { PR } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import { generateSha256HashFromBuffer } from 'freedom-crypto';
import type { StaticSyncablePath } from 'freedom-sync-types';

import type { SyncableStoreBacking } from '../../types/backing/SyncableStoreBacking.ts';
import type { MutableBundleAccessor } from '../../types/MutableBundleAccessor.ts';
import type { MutableFlatFileAccessor } from '../../types/MutableFlatFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SyncTracker } from '../../types/SyncTracker.ts';
import { DefaultBundleBase } from './DefaultBundleBase.ts';
import { DefaultMutableFlatFileAccessor } from './DefaultMutableFlatFileAccessor.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';

export interface DefaultEncryptedBundleConstructorArgs {
  store: WeakRef<MutableSyncableStore>;
  backing: SyncableStoreBacking;
  syncTracker: SyncTracker;
  folderOperationsHandler: FolderOperationsHandler;
  path: StaticSyncablePath;
}

export class DefaultEncryptedBundle extends DefaultBundleBase {
  constructor({ store, backing, syncTracker, folderOperationsHandler, path }: DefaultEncryptedBundleConstructorArgs) {
    super({
      store,
      backing,
      syncTracker,
      folderOperationsHandler,
      path,
      supportsDeletion: true
    });
  }

  // DefaultBundleBase Abstract Method Implementations

  protected override computeHash_(trace: Trace, encodedData: Uint8Array): PR<Sha256Hash> {
    return generateSha256HashFromBuffer(trace, encodedData);
  }

  protected override decodeData_(trace: Trace, encodedData: Uint8Array): PR<Uint8Array> {
    return this.folderOperationsHandler_.verifyAndDecryptBuffer(trace, encodedData);
  }

  protected encodeData_(trace: Trace, rawData: Uint8Array): PR<Uint8Array> {
    return this.folderOperationsHandler_.encryptAndSignBuffer(trace, rawData);
  }

  protected override makeBundleAccessor_({ path }: { path: StaticSyncablePath }): MutableBundleAccessor {
    return new DefaultEncryptedBundle({
      store: this.weakStore_,
      backing: this.backing_,
      syncTracker: this.syncTracker_,
      folderOperationsHandler: this.folderOperationsHandler_,
      path
    });
  }

  protected override makeFlatFileAccessor_({ path }: { path: StaticSyncablePath }): MutableFlatFileAccessor {
    return new DefaultMutableFlatFileAccessor({
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
