import { makeTrace } from 'freedom-contexts';
import { extractKeyIdFromSignedValue } from 'freedom-crypto';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { NotificationManager } from 'freedom-notification-types';
import type { StorageRootId, SyncableProvenance } from 'freedom-sync-types';
import { StaticSyncablePath } from 'freedom-sync-types';

import { InMemoryAccessControlledFolderBase } from '../internal/types/InMemoryAccessControlledFolderBase.ts';
import type { SyncableStoreBacking } from './backing/SyncableStoreBacking.ts';
import { InMemoryTrustMarkStore } from './InMemoryTrustMarkStore.ts';
import type { MutableSyncableStore } from './MutableSyncableStore.ts';
import type { SyncTrackerNotifications } from './SyncTracker.ts';

// TODO: rename to DefaultSyncableStore in a separate PR
export class InMemorySyncableStore extends InMemoryAccessControlledFolderBase implements MutableSyncableStore {
  public readonly creatorCryptoKeySetId: CryptoKeySetId;
  public readonly cryptoService: CryptoService;

  public readonly localTrustMarks = new InMemoryTrustMarkStore();

  constructor({
    storageRootId,
    backing,
    cryptoService,
    provenance
  }: {
    storageRootId: StorageRootId;
    backing: SyncableStoreBacking;
    cryptoService: CryptoService;
    provenance: SyncableProvenance;
  }) {
    const syncTracker = new NotificationManager<SyncTrackerNotifications>();
    const path = new StaticSyncablePath(storageRootId);

    super({ backing, syncTracker, path });

    this.cryptoService = cryptoService;

    const creatorCryptoKeySetId = extractKeyIdFromSignedValue(makeTrace('new InMemorySyncableStore'), { signedValue: provenance.origin });
    if (!creatorCryptoKeySetId.ok) {
      throw creatorCryptoKeySetId.value;
    }
    this.creatorCryptoKeySetId = creatorCryptoKeySetId.value;

    const weakStore = new WeakRef(this);
    const folderOperationsHandler = this.makeFolderOperationsHandler_(weakStore);
    this.deferredInit_({ store: weakStore, folderOperationsHandler });
  }
}
