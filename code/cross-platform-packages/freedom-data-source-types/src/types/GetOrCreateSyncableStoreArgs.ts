import type { CryptoService } from 'freedom-crypto-service';
import type { SaltId, StorageRootId } from 'freedom-sync-types';

export interface GetOrCreateSyncableStoreArgs {
  storageRootId: StorageRootId;
  cryptoService: CryptoService;
  saltsById: Partial<Record<SaltId, string>>;
}
