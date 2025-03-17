import type { PR } from 'freedom-async';
import { makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import { generateSha256HashFromBuffer } from 'freedom-crypto';
import type { StaticSyncablePath, SyncableProvenance } from 'freedom-sync-types';

import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SyncTracker } from '../../types/SyncTracker.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';
import { InMemoryBundleBase } from './InMemoryBundleBase.ts';

export interface InMemoryEncryptedBundleConstructorArgs {
  store: WeakRef<MutableSyncableStore>;
  syncTracker: SyncTracker;
  folderOperationsHandler: FolderOperationsHandler;
  path: StaticSyncablePath;
  provenance: SyncableProvenance;
}

export class InMemoryEncryptedBundle extends InMemoryBundleBase {
  constructor({ store, syncTracker, folderOperationsHandler, path, provenance }: InMemoryEncryptedBundleConstructorArgs) {
    super({
      store,
      syncTracker,
      folderOperationsHandler,
      path,
      provenance,
      supportsDeletion: true
    });
  }

  // InMemoryBundleBase Abstract Method Implementations

  protected override computeHash_(trace: Trace, encodedData: Uint8Array): PR<Sha256Hash> {
    return generateSha256HashFromBuffer(trace, encodedData);
  }

  protected override decodeData_(trace: Trace, encodedData: Uint8Array): PR<Uint8Array> {
    return this.folderOperationsHandler_.verifyAndDecryptBuffer(trace, encodedData);
  }

  protected encodeData_(trace: Trace, rawData: Uint8Array): PR<Uint8Array> {
    return this.folderOperationsHandler_.encryptAndSignBuffer(trace, rawData);
  }

  protected override async newBundle_(
    _trace: Trace,
    { path, provenance }: { path: StaticSyncablePath; provenance: SyncableProvenance }
  ): PR<InMemoryEncryptedBundle> {
    return makeSuccess(
      new InMemoryEncryptedBundle({
        store: this.weakStore_,
        syncTracker: this.syncTracker_,
        folderOperationsHandler: this.folderOperationsHandler_,
        path,
        provenance
      })
    );
  }
}
