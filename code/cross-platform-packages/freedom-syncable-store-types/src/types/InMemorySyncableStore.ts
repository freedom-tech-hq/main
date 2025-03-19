import { makeTrace } from 'freedom-contexts';
import { extractKeyIdFromSignedValue } from 'freedom-crypto';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { NotificationManager } from 'freedom-notification-types';
import type { StorageRootId, SyncableProvenance } from 'freedom-sync-types';
import { invalidProvenance, StaticSyncablePath } from 'freedom-sync-types';

import { InMemoryAccessControlledFolderBase } from '../internal/types/InMemoryAccessControlledFolderBase.ts';
import { InMemoryEncryptedBundle } from '../internal/types/InMemoryEncryptedBundle.ts';
import { InMemoryFolder } from '../internal/types/InMemoryFolder.ts';
import { InMemoryPlainBundle } from '../internal/types/InMemoryPlainBundle.ts';
import { InMemoryStoreAdapter } from '../internal/types/InMemoryStoreAdapter.ts';
import { InMemoryTrustMarkStore } from './InMemoryTrustMarkStore.ts';
import type { MutableSyncableStore } from './MutableSyncableStore.ts';
import type { StoreAdapterFactory } from './StoreAdapter.ts';
import type { SyncTrackerNotifications } from './SyncTracker.ts';

export class InMemorySyncableStore extends InMemoryAccessControlledFolderBase implements MutableSyncableStore {
  public readonly creatorCryptoKeySetId: CryptoKeySetId;
  public readonly cryptoService: CryptoService;

  public readonly localTrustMarks = new InMemoryTrustMarkStore();

  public readonly createStoreAdapterPerPath: StoreAdapterFactory = (_path) => new InMemoryStoreAdapter();

  constructor({
    storageRootId,
    cryptoService,
    provenance
  }: {
    storageRootId: StorageRootId;
    cryptoService: CryptoService;
    provenance: SyncableProvenance;
  }) {
    const syncTracker = new NotificationManager<SyncTrackerNotifications>();
    const path = new StaticSyncablePath(storageRootId);

    super({ syncTracker, path, provenance });

    this.cryptoService = cryptoService;

    const creatorCryptoKeySetId = extractKeyIdFromSignedValue(makeTrace('new InMemorySyncableStore'), { signedValue: provenance.origin });
    if (!creatorCryptoKeySetId.ok) {
      throw creatorCryptoKeySetId.value;
    }
    this.creatorCryptoKeySetId = creatorCryptoKeySetId.value;

    const weakStore = new WeakRef(this);
    const folderOperationsHandler = this.makeFolderOperationsHandler_(weakStore);

    this.deferredInit_({
      store: weakStore,
      folderOperationsHandler,
      plainBundle: new InMemoryPlainBundle({
        store: weakStore,
        syncTracker,
        folderOperationsHandler,
        path,
        provenance: invalidProvenance,
        supportsDeletion: false
      }),
      folder: new InMemoryFolder({
        store: weakStore,
        syncTracker,
        folderOperationsHandler,
        path
      }),
      encryptedBundle: new InMemoryEncryptedBundle({
        store: weakStore,
        syncTracker,
        folderOperationsHandler,
        provenance: invalidProvenance,
        path
      })
    });
  }
}
