import type { CryptoService } from 'freedom-crypto-service';
import type { StorageRootId } from 'freedom-sync-types';

export interface GetOrCreateSyncableStoreArgs {
  storageRootId: StorageRootId;
  cryptoService: CryptoService;
}
