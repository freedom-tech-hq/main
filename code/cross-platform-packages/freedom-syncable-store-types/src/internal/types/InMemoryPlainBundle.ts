import type { PR } from 'freedom-async';
import { makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import { generateSha256HashFromBuffer } from 'freedom-crypto';
import type { StaticSyncablePath, SyncableProvenance } from 'freedom-sync-types';

import type { InMemoryBundleBaseConstructorArgs } from './InMemoryBundleBase.ts';
import { InMemoryBundleBase } from './InMemoryBundleBase.ts';

export type InMemoryPlainBundleConstructorArgs = InMemoryBundleBaseConstructorArgs;

export class InMemoryPlainBundle extends InMemoryBundleBase {
  // InMemoryBundleBase Abstract Method Implementations

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

  protected override async newBundle_(
    _trace: Trace,
    { path, provenance }: { path: StaticSyncablePath; provenance: SyncableProvenance }
  ): PR<InMemoryPlainBundle> {
    return makeSuccess(
      new InMemoryPlainBundle({
        store: this.weakStore_,
        syncTracker: this.syncTracker_,
        path,
        provenance,
        folderOperationsHandler: this.folderOperationsHandler_,
        supportsDeletion: this.supportsDeletion
      })
    );
  }
}
