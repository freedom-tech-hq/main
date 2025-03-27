import type { PR } from 'freedom-async';
import { makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import { generateSha256HashFromBuffer } from 'freedom-crypto';
import type { StaticSyncablePath } from 'freedom-sync-types';

import type { MutableBundleAccessor } from '../../types/MutableBundleAccessor.ts';
import type { MutableFlatFileAccessor } from '../../types/MutableFlatFileAccessor.ts';
import type { DefaultBundleBaseConstructorArgs } from './DefaultBundleBase.ts';
import { DefaultBundleBase } from './DefaultBundleBase.ts';
import { DefaultMutableFlatFileAccessor } from './DefaultMutableFlatFileAccessor.ts';

export type DefaultPlainBundleConstructorArgs = DefaultBundleBaseConstructorArgs;

export class DefaultPlainBundle extends DefaultBundleBase {
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

  protected override makeBundleAccessor_({ path }: { path: StaticSyncablePath }): MutableBundleAccessor {
    return new DefaultPlainBundle({
      store: this.weakStore_,
      backing: this.backing_,
      syncTracker: this.syncTracker_,
      path,
      folderOperationsHandler: this.folderOperationsHandler_,
      supportsDeletion: this.supportsDeletion
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
    return false;
  }
}
