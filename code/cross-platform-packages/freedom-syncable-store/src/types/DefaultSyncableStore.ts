import { makeUuid } from 'freedom-contexts';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { makeDevLoggingSupport } from 'freedom-dev-logging-support';
import { NotificationManager } from 'freedom-notification-types';
import type { SaltId, StorageRootId } from 'freedom-sync-types';
import { SyncablePath } from 'freedom-sync-types';
import type { SyncableStoreBacking } from 'freedom-syncable-store-backing-types';
import type { MutableSyncableStore, SyncableStoreLogEntry, SyncTrackerNotifications } from 'freedom-syncable-store-types';

import { getOrCreateDefaultMutableSyncableFolderAccessor } from '../internal/types/DefaultMutableSyncableFolderAccessor.ts';
import { DefaultMutableSyncableFolderAccessorBase } from '../internal/types/DefaultMutableSyncableFolderAccessorBase.ts';
import { InMemoryTrustMarkStore } from './InMemoryTrustMarkStore.ts';

export interface DefaultSyncableStoreConstructorArgs {
  storageRootId: StorageRootId;
  backing: SyncableStoreBacking;
  cryptoService: CryptoService;
  creatorPublicKeys: CombinationCryptoKeySet;
  saltsById: Partial<Record<SaltId, string>>;
}

export class DefaultSyncableStore extends DefaultMutableSyncableFolderAccessorBase implements MutableSyncableStore {
  public readonly uid = makeUuid();
  public readonly creatorPublicKeys: CombinationCryptoKeySet;
  public readonly cryptoService: CryptoService;
  public readonly saltsById: Partial<Record<SaltId, string>>;

  public readonly localTrustMarks = new InMemoryTrustMarkStore();

  constructor({ storageRootId, backing, cryptoService, creatorPublicKeys, saltsById }: DefaultSyncableStoreConstructorArgs) {
    const syncTracker = new NotificationManager<SyncTrackerNotifications>();
    const path = new SyncablePath(storageRootId);

    super({ backing, syncTracker, path });

    this.creatorPublicKeys = creatorPublicKeys;
    this.cryptoService = cryptoService;
    this.saltsById = saltsById;

    this.deferredInit_({
      store: this,
      makeFolderAccessor: ({ path }) => getOrCreateDefaultMutableSyncableFolderAccessor({ store: this, backing, path, syncTracker })
    });
  }

  // Public Methods

  public toString() {
    return `Store(${this.path.toString()})`;
  }

  public readonly devLogging = makeDevLoggingSupport<SyncableStoreLogEntry>(false);
}
