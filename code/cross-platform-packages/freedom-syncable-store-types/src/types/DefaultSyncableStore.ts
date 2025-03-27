import { makeTrace } from 'freedom-contexts';
import { extractKeyIdFromSignedValue } from 'freedom-crypto';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { NotificationManager } from 'freedom-notification-types';
import type { StorageRootId, SyncableProvenance } from 'freedom-sync-types';
import { StaticSyncablePath } from 'freedom-sync-types';

import { DefaultAccessControlledFolder } from '../internal/types/DefaultAccessControlledFolder.ts';
import { DefaultAccessControlledFolderBase } from '../internal/types/DefaultAccessControlledFolderBase.ts';
import type { SyncableStoreBacking } from './backing/SyncableStoreBacking.ts';
import { InMemoryTrustMarkStore } from './InMemoryTrustMarkStore.ts';
import type { MutableSyncableStore } from './MutableSyncableStore.ts';
import type { SyncTrackerNotifications } from './SyncTracker.ts';

export class DefaultSyncableStore extends DefaultAccessControlledFolderBase implements MutableSyncableStore {
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

    const creatorCryptoKeySetId = extractKeyIdFromSignedValue(makeTrace(import.meta.filename, 'new'), { signedValue: provenance.origin });
    if (!creatorCryptoKeySetId.ok) {
      throw creatorCryptoKeySetId.value;
    }
    this.creatorCryptoKeySetId = creatorCryptoKeySetId.value;

    const weakStore = new WeakRef(this);
    this.deferredInit_({
      store: weakStore,
      makeFolderAccessor: ({ path }) => new DefaultAccessControlledFolder({ store: weakStore, backing, path, syncTracker })
    });
  }
}
