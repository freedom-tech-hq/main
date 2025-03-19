import type { SyncableId } from 'freedom-sync-types';
import type { StorableObject } from 'freedom-object-store-types';
import type { FlatFileAccessor } from './FlatFileAccessor.ts';
import type { MutableBundleFileAccessor } from './MutableBundleFileAccessor.ts';
import type { SyncablePath } from 'freedom-sync-types';

export interface InternalFlatFile {
  type: 'flatFile';
  accessor: FlatFileAccessor;
}

export interface InternalBundleFile {
  type: 'bundleFile';
  accessor: MutableBundleFileAccessor;
}

export type AnyFile = InternalFlatFile | InternalBundleFile;

/**
 * StoreAdapter implements physical representation of our files.
 */
export interface StoreAdapter {
  /**
   * Gets the file path for a given ID.
   */
  getFilePath(id: SyncableId): string;

  /**
   * Checks if a file exists for a given ID.
   */
  isFileExists(id: SyncableId): Promise<boolean>;

  /**
   * Retrieves file metadata for a given ID.
   */
  getFileMetadata<T extends AnyFile = AnyFile>(id: SyncableId): Promise<StorableObject<T> | undefined>;

  /**
   * Saves file metadata for a given ID.
   */
  saveFileMetadata(id: SyncableId, metadata: StorableObject<AnyFile>): Promise<void>;

  /**
   * Deletes file metadata for a given ID.
   */
  deleteFileMetadata(id: SyncableId): Promise<void>;

  /**
   * Gets all file IDs in the store.
   */
  getAllFileIds(): Promise<SyncableId[]>;

  /**
   * Gets all files in the store.
   */
  getAllFiles<T extends AnyFile = AnyFile>(): Promise<StorableObject<T>[]>;
}

/**
 * Pavel's note: I don't like the idea of multi-instance adapter, but the current implementation
 * of in-memory store support implicit destruction per bundle. So I'm keeping it for now.
 */
export type StoreAdapterFactory = (path: SyncablePath) => StoreAdapter;
