import { makeTrace } from 'freedom-contexts';
import { extractKeyIdFromSignedValue } from 'freedom-crypto';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { NotificationManager } from 'freedom-notification-types';
import type { SaltId, StorageRootId, SyncableProvenance } from 'freedom-sync-types';
import { DEFAULT_SALT_ID, SyncablePath } from 'freedom-sync-types';

import { DefaultMutableSyncableFolderAccessor } from '../internal/types/DefaultMutableSyncableFolderAccessor.ts';
import { DefaultMutableSyncableFolderAccessorBase } from '../internal/types/DefaultMutableSyncableFolderAccessorBase.ts';
import type { SyncableStoreBacking } from './backing/SyncableStoreBacking.ts';
import { InMemoryTrustMarkStore } from './InMemoryTrustMarkStore.ts';
import type { MutableSyncableStore } from './MutableSyncableStore.ts';
import type { SyncTrackerNotifications } from './SyncTracker.ts';

export interface DefaultSyncableStoreConstructorArgs {
  storageRootId: StorageRootId;
  backing: SyncableStoreBacking;
  cryptoService: CryptoService;
  provenance: SyncableProvenance;
  saltsById: Partial<Record<SaltId, string>>;
}

export class DefaultSyncableStore extends DefaultMutableSyncableFolderAccessorBase implements MutableSyncableStore {
  public readonly creatorCryptoKeySetId: CryptoKeySetId;
  public readonly cryptoService: CryptoService;
  public readonly defaultSalt: string | undefined;
  public readonly saltsById: Partial<Record<SaltId, string>>;

  public readonly localTrustMarks = new InMemoryTrustMarkStore();

  constructor({ storageRootId, backing, cryptoService, provenance, saltsById }: DefaultSyncableStoreConstructorArgs) {
    const syncTracker = new NotificationManager<SyncTrackerNotifications>();
    const path = new SyncablePath(storageRootId);

    super({ backing, syncTracker, path });

    this.cryptoService = cryptoService;
    this.saltsById = saltsById;
    this.defaultSalt = saltsById[DEFAULT_SALT_ID];

    const creatorCryptoKeySetId = extractKeyIdFromSignedValue(makeTrace(import.meta.filename, 'new'), { signedValue: provenance.origin });
    if (!creatorCryptoKeySetId.ok) {
      throw creatorCryptoKeySetId.value;
    }
    this.creatorCryptoKeySetId = creatorCryptoKeySetId.value;

    this.deferredInit_({
      store: this,
      makeFolderAccessor: ({ path }) => new DefaultMutableSyncableFolderAccessor({ store: this, backing, path, syncTracker })
    });
  }
}
