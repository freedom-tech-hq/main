import { InMemorySyncableStore } from 'freedom-syncable-store-types';
import type { StoreAdapterFactory } from 'freedom-syncable-store-types';
import { FSStoreAdapter } from '../internal/types/FSStoreAdapter.ts';
import type { StorageRootId, SyncableProvenance } from 'freedom-sync-types';
import type { CryptoService } from 'freedom-crypto-service';

/**
 * File system implementation of the MutableSyncableStore interface.
 * Persists data to the file system while maintaining the same cryptographic
 * security guarantees as the InMemorySyncableStore implementation.
 */
export class FSSyncableStore extends InMemorySyncableStore {

  private readonly fsDirectory_: string

  constructor({
    storageRootId,
    cryptoService,
    provenance,
    fsDirectory,
  }: {
    storageRootId: StorageRootId;
    cryptoService: CryptoService;
    provenance: SyncableProvenance;
    fsDirectory: string;
  }) {
    super({ storageRootId, cryptoService, provenance });

    this.fsDirectory_ = fsDirectory;
  }

  public readonly createStoreAdapterPerPath: StoreAdapterFactory = (path) => new FSStoreAdapter({
    fsDirectory: this.fsDirectory_,
    path
  })
}
