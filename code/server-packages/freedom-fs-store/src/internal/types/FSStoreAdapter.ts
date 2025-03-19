import * as fs from 'fs/promises';
import * as path from 'path';

import type { SyncableId, DynamicSyncableId } from 'freedom-sync-types';
import type { StorableObject } from 'freedom-object-store-types';
import type { SyncablePath } from 'freedom-sync-types';
import type { StoreAdapter, AnyFile } from 'freedom-syncable-store-types';
import { isFileNotFoundError } from '../fsUtils.ts';
import { InMemoryStoreAdapter } from 'freedom-syncable-store-types';

function getFsId(v: SyncableId | DynamicSyncableId): string {
  if (typeof v === 'string') {
    return v.replaceAll('+', '-').replaceAll('/', '_').substring(0, 20);
  }

  throw new Error('Not implemented: serialization');
}

/**
 * FSStoreAdapter provides file system utility methods for storing and retrieving
 * file metadata in a file-based storage system.
 */
export class FSStoreAdapter implements StoreAdapter {
  /** Our root storage directory */
  private readonly fsDirectory_: string;

  /** Instance path */
  private readonly path: SyncablePath;

  private readonly fileMetadataCache: InMemoryStoreAdapter;

  constructor({
    fsDirectory,
    path,
  }: {
    fsDirectory: string;
    path: SyncablePath;
  }) {
    this.fsDirectory_ = fsDirectory;
    this.path = path;

    this.fileMetadataCache = new InMemoryStoreAdapter();
  }

  /**
   * Gets the file path for a given ID.
   */
  private getFilePath(id: SyncableId): string {
    return path.join(
      this.fsDirectory_,
      this.path.storageRootId,
      ...this.path.ids.map(getFsId),
      `${getFsId(id)}.json`
    );
  }

  /**
   * Checks if a file exists for a given ID.
   */
  public async isFileExists(id: SyncableId): Promise<boolean> {
    return this.fileMetadataCache.isFileExists(id);

    // const filePath = this.getFilePath(id);
    // try {
    //   await fs.access(filePath);
    //   return true;
    // } catch (error) {
    //   if (isFileNotFoundError(error)) {
    //     return false;
    //   }
    //   throw error;
    // }
  }

  /**
   * Retrieves file metadata for a given ID.
   */
  public async getFileMetadata<T extends AnyFile = AnyFile>(id: SyncableId): Promise<StorableObject<T> | undefined> {
    return this.fileMetadataCache.getFileMetadata(id);
    // console.log(`Retrieving file metadata for ${id}`);
    //
    // const filePath = this.getFilePath(id);
    // try {
    //   const fileContent = await fs.readFile(filePath, 'utf8');
    //   return JSON.parse(fileContent) as StorableObject<T>;
    // } catch (error) {
    //   if (isFileNotFoundError(error)) {
    //     return undefined;
    //   }
    //   throw error;
    // }
  }

  // private deserializeFileMetadata(id: SyncableId, raw: any): StorableObject<AnyFile> {
  //   const path = this.path.append(id);
  //
  //   switch (raw.storedValue['type']) {
  //     case 'bundleFile': return {
  //       storedValue: {
  //         type: 'bundleFile',
  //         accessor: new InMemoryMutableBundleFileAccessor({
  //           store: this.weakStore_,
  //           path,
  //           data: bundle.value
  //         })
  //       },
  //       updateCount: 0
  //     } satisfies StorableObject<InternalBundleFile>;
  //
  //
  //   }
  //   return this.getFileMetadata<T>(id);
  // }

  /**
   * Saves file metadata for a given ID.
   */
  public async saveFileMetadata(id: SyncableId, metadata: StorableObject<AnyFile>): Promise<void> {
    this.fileMetadataCache.saveFileMetadata(id, metadata);

    console.log(`Saving file metadata for ${id}`);

    const filePath = this.getFilePath(id);
    const payload = JSON.stringify(metadata, null, 2);

    console.log(`Saving file metadata for ${id} to ${filePath}`);

    try {
      await fs.writeFile(filePath, payload, 'utf8');
    } catch (error) {
      if (!isFileNotFoundError(error)) {
        throw error;
      }

      // Create the parent directory and retry
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, payload, 'utf8');
    }
  }

  /**
   * Deletes file metadata for a given ID.
   */
  public async deleteFileMetadata(id: SyncableId): Promise<void> {
    this.fileMetadataCache.deleteFileMetadata(id);

    const filePath = this.getFilePath(id);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (!isFileNotFoundError(error)) {
        throw error;
      }
    }
  }

  /**
   * Gets all file IDs in the directory.
   */
  public async getAllFileIds(): Promise<SyncableId[]> {
    return this.fileMetadataCache.getAllFileIds();
    // await fs.mkdir(this.fsDirectory_, { recursive: true });
    // const files = await fs.readdir(this.fsDirectory_);
    // return files
    //   .filter(file => file.endsWith('.json'))
    //   .map(file => file.slice(0, -5) as SyncableId); // Remove .json extension
  }

  /**
   * Gets all files in the directory.
   */
  public async getAllFiles<T extends AnyFile = AnyFile>(): Promise<StorableObject<T>[]> {
    return this.fileMetadataCache.getAllFiles();
    // const fileIds = await this.getAllFileIds();
    // const files = await Promise.all(fileIds.map(id => this.getFileMetadata<T>(id)));
    // return files.filter((file): file is StorableObject<T> => file !== undefined);
  }
}
