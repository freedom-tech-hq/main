import type { SyncableId } from 'freedom-sync-types';
import type { StorableObject } from 'freedom-object-store-types';
import type { StoreAdapter, AnyFile } from './StoreAdapter.ts';

/**
 * In-memory implementation of the StoreAdapter interface.
 * Stores file metadata in memory using a Map.
 */
export class InMemoryStoreAdapter implements StoreAdapter {
  private readonly files_ = new Map<SyncableId, StorableObject<AnyFile>>();

  /**
   * Checks if a file exists for a given ID.
   */
  async isFileExists(id: SyncableId): Promise<boolean> {
    return this.files_.has(id);
  }

  /**
   * Retrieves file metadata for a given ID.
   */
  async getFileMetadata<T extends AnyFile = AnyFile>(id: SyncableId): Promise<StorableObject<T> | undefined> {
    console.log(`Retrieving file metadata for ${id}`);
    return this.files_.get(id) as StorableObject<T> | undefined;
  }

  /**
   * Saves file metadata for a given ID.
   */
  async saveFileMetadata(id: SyncableId, metadata: StorableObject<AnyFile>): Promise<void> {
    console.log(`Saving file metadata for ${id}`);
    this.files_.set(id, metadata);
  }

  /**
   * Deletes file metadata for a given ID.
   */
  async deleteFileMetadata(id: SyncableId): Promise<void> {
    this.files_.delete(id);
  }

  /**
   * Gets all file IDs in the store.
   */
  async getAllFileIds(): Promise<SyncableId[]> {
    return Array.from(this.files_.keys());
  }

  /**
   * Gets all files in the store.
   */
  async getAllFiles<T extends AnyFile = AnyFile>(): Promise<StorableObject<T>[]> {
    return Array.from(this.files_.values()) as StorableObject<T>[];
  }
}
