import { allResults, makeAsyncResultFunc, makeFailure, makeSuccess, type PR, type PRFunc } from 'freedom-async';
import { InternalStateError, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { LocalItemMetadata, StorageRootId, SyncableId, SyncableItemType } from 'freedom-sync-types';
import { extractSyncableIdParts, SyncablePath } from 'freedom-sync-types';
import type {
  SyncableStoreBacking,
  SyncableStoreBackingFileAccessor,
  SyncableStoreBackingFolderAccessor,
  SyncableStoreBackingItemAccessor,
  SyncableStoreBackingItemMetadata
} from 'freedom-syncable-store-backing-types';
import { syncableStoreBackingItemMetadataSchema } from 'freedom-syncable-store-backing-types';
import type { IBucket, IFile } from 'mock-gcs';
import type { SingleOrArray } from 'yaschema';

import { getGsPathFromSyncablePath } from '../internal/utils/getGsPathFromSyncablePath.ts';
import { restoreNamePartFromSafe } from '../internal/utils/restoreNamePartFromSafe.ts';

// Note: it contains 'metadata' field, and we pass the whole object to 'metadata' field
// This is how GS work in reality although its typing reads differently. Keys could only be strings
type GsMetadataTyping = { metadata: { custom: string } };

async function getInternalMetadataFromMetadata(metadata: SyncableStoreBackingItemMetadata): Promise<GsMetadataTyping> {
  const serialized = await syncableStoreBackingItemMetadataSchema.stringifyAsync(metadata);
  return { metadata: { custom: serialized } };
}

async function getMetadataFromInternalMetadata(internalMetadata: GsMetadataTyping): Promise<SyncableStoreBackingItemMetadata> {
  return await syncableStoreBackingItemMetadataSchema.parseAsync(internalMetadata.metadata.custom);
}

/**
 * Implementation of SyncableStoreBacking that uses Google Cloud Storage as the backing store.
 */
export class GoogleStorageSyncableStoreBacking implements SyncableStoreBacking {
  private readonly prefix_: string;
  private readonly bucket_: IBucket; // IBucket is a compatibility subset between the real and mock implementations

  /**
   * Creates a new GoogleStorageSyncableStoreBacking.
   *
   * @param bucket - Optional bucket instance for testing; if not provided, a real GCS bucket will be used
   */
  constructor(bucket: IBucket, prefix: string = '') {
    this.bucket_ = bucket;
    this.prefix_ = prefix;
  }

  /**
   * Creates root metadata that contains mainly provenance.
   * This must be done exactly once for newly-created backings.
   */
  public readonly initialize = makeAsyncResultFunc(
    [import.meta.filename, 'initialize'],
    async (_trace, storageRootId: StorageRootId, metadata: SyncableStoreBackingItemMetadata) => {
      // Convert path
      const gsPath = getGsPathFromSyncablePath(this.prefix_, new SyncablePath(storageRootId), 'item');

      const internalMetadata = await getInternalMetadataFromMetadata(metadata);

      // Upload the folder marker with metadata
      // TODO: interpret exceptions
      await this.bucket_.file(gsPath).save('', {
        metadata: internalMetadata
      });

      return makeSuccess(undefined);
    }
  );

  /**
   * Checks if an item exists at the specified path.
   */
  public readonly existsAtPath: PRFunc<boolean, never, [path: SyncablePath]> = makeAsyncResultFunc(
    [import.meta.filename, 'existsAtPath'],
    async (_trace: Trace, path: SyncablePath) => {
      const gsPath = getGsPathFromSyncablePath(this.prefix_, path, 'item');
      const [exists] = await this.bucket_.file(gsPath).exists();
      return makeSuccess(exists);
    }
  );

  /**
   * Gets an item accessor for the item at the specified path.
   */
  public readonly getAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'getAtPath'],
    async <T extends SyncableItemType = SyncableItemType>(
      trace: Trace,
      path: SyncablePath,
      expectedType?: SingleOrArray<T>
    ): PR<SyncableStoreBackingItemAccessor & { type: T }, 'not-found' | 'wrong-type'> => {
      const type = path.lastId === undefined ? 'folder' : extractSyncableIdParts(path.lastId).type;

      if (expectedType !== undefined && !Array.isArray(expectedType) && expectedType !== type) {
        return makeFailure(
          new InternalStateError(trace, {
            errorCode: 'wrong-type',
            message: `Expected type ${expectedType}, found ${type}`
          })
        );
      }

      const existsResult = await this.existsAtPath(trace, path);
      if (!existsResult.ok) {
        return existsResult;
      }
      if (!existsResult.value) {
        return makeFailure(
          new NotFoundError(trace, {
            errorCode: 'not-found',
            message: 'Not found'
          })
        );
      }

      if (type === 'file') {
        // TODO: Remove <T> from interface and any from here
        return makeSuccess<any>({
          type: 'file',
          id: path.ids[path.ids.length - 1],
          getBinary: async (): PR<Uint8Array<ArrayBufferLike>> => {
            const gsPath = getGsPathFromSyncablePath(this.prefix_, path, 'item');
            const file = this.bucket_.file(gsPath);
            const [content] = await file.download();
            return makeSuccess<Uint8Array<ArrayBufferLike>>(content);
          }
        } satisfies SyncableStoreBackingFileAccessor);
      }

      // TODO: Remove <T> from interface and any from here
      return makeSuccess<any>({
        type: 'folder',
        id: path.ids[path.ids.length - 1]
      } satisfies SyncableStoreBackingFolderAccessor);
    }
  );

  /**
   * Gets the IDs of all items in the specified path.
   */
  public readonly getIdsInPath: PRFunc<
    SyncableId[],
    'not-found' | 'wrong-type',
    [path: SyncablePath, options?: { type?: SingleOrArray<SyncableItemType> }]
  > = makeAsyncResultFunc(
    [import.meta.filename, 'getIdsInPath'],
    async (trace: Trace, path: SyncablePath, options?: { type?: SingleOrArray<SyncableItemType> }) => {
      const types = options?.type === undefined ? undefined : new Set(Array.isArray(options.type) ? options.type : [options.type]);

      const listResult = await this.listFiles_(trace, path, ({ id }) => {
        if (types !== undefined) {
          const { type } = extractSyncableIdParts(id);
          if (!types.has(type)) {
            return undefined;
          }
        }

        return id;
      });

      return listResult;
    }
  );

  /**
   * Gets the metadata for the item at the specified path.
   */
  public readonly getMetadataAtPath: PRFunc<SyncableStoreBackingItemMetadata, 'not-found' | 'wrong-type', [path: SyncablePath]> =
    makeAsyncResultFunc([import.meta.filename, 'getMetadataAtPath'], async (trace: Trace, path: SyncablePath) => {
      const gsPath = getGsPathFromSyncablePath(this.prefix_, path, 'item');
      const file = this.bucket_.file(gsPath);

      const metadataResult = await this.getGsFileMetadata_(trace, file);
      if (!metadataResult.ok) {
        return metadataResult;
      }

      const result = await getMetadataFromInternalMetadata(metadataResult.value);

      return makeSuccess(result);
    });

  // TODO: Consider extracting private members to internal/utils for smaller (and better focused) files
  private readonly listFiles_ = makeAsyncResultFunc(
    [import.meta.filename, 'listFiles_'],
    async <T>(trace: Trace, path: SyncablePath, mapper: (args: { id: SyncableId; file: IFile }) => T | undefined): PR<T[], 'not-found'> => {
      const gcsPrefix = getGsPathFromSyncablePath(this.prefix_, path, 'scan-direct');
      const [files] = await this.bucket_.getFiles({
        prefix: gcsPrefix
      });

      // Handle not found case. Minimize requests, do not check ahead
      if (files.length === 0) {
        // For the root we have no call to initialize it. So non-existent and empty stores are the same
        // TODO: revise this, maybe store creates root
        // if (path.ids.length === 0) {
        //   return makeSuccess<T[]>([]);
        // }

        const existsResult = await this.existsAtPath(trace, path);
        if (!existsResult.ok) {
          return existsResult;
        }
        if (existsResult.value) {
          return makeSuccess<T[]>([]);
        }
        return makeFailure(
          new NotFoundError(trace, {
            errorCode: 'not-found',
            message: `Folder at path not found`
          })
        );
      }

      const result: T[] = files
        .map((file) => {
          const id = restoreNamePartFromSafe(file.name.substring(gcsPrefix.length + 1));
          return mapper({ id, file });
        })
        .filter((v) => v !== undefined);

      return makeSuccess(result);
    }
  );

  private readonly getGsFileMetadata_ = makeAsyncResultFunc(
    [import.meta.filename, 'getFileMetadata_'],
    async (trace: Trace, file: IFile): PR<GsMetadataTyping, 'not-found'> => {
      const metadataResult = await this.identifyNotFound_(trace, () => file.getMetadata());
      if (!metadataResult.ok) {
        return metadataResult;
      }

      return makeSuccess(metadataResult.value[0]);
    }
  );

  private readonly identifyNotFound_ = makeAsyncResultFunc(
    [import.meta.filename, 'identifyNotFound_'],
    async <T>(trace: Trace, singleApiCall: () => Promise<T>): PR<T, 'not-found'> => {
      try {
        return makeSuccess(await singleApiCall());
      } catch (e) {
        if (
          e instanceof Error &&
          ((e as { code?: unknown }).code === 404 || // Real API
            e.message.startsWith('No such file: ')) // Mocked API
        ) {
          return makeFailure(
            new NotFoundError(trace, {
              errorCode: 'not-found',
              message: `Item at path not found`
            })
          );
        }

        throw e;
      }
    }
  );

  /**
   * Gets the metadata for the specified items in the specified path.
   */
  public readonly getMetadataByIdInPath: PRFunc<
    Partial<Record<SyncableId, SyncableStoreBackingItemMetadata>>,
    'not-found' | 'wrong-type',
    [path: SyncablePath, ids?: Set<SyncableId>]
  > = makeAsyncResultFunc(
    [import.meta.filename, 'getMetadataByIdInPath'],
    async (trace: Trace, path: SyncablePath, ids?: Set<SyncableId>) => {
      const listResult = await this.listFiles_(trace, path, ({ id, file }) => {
        if (ids !== undefined && !ids.has(id)) {
          return undefined;
        }

        return {
          id,
          metadataPromise: this.getGsFileMetadata_(trace, file)
        };
      });
      if (!listResult.ok) {
        return listResult;
      }

      const records = listResult.value;

      if (records.length === 0) {
        return makeSuccess<Partial<Record<SyncableId, SyncableStoreBackingItemMetadata>>>({});
      }

      // Note: parallelism is limited at the connection level. See createGoogleStorageSyncableStoreBacking()
      const metadataResults = await allResults(
        trace,
        records.map(({ metadataPromise }) => metadataPromise)
      );
      if (!metadataResults.ok) {
        return metadataResults;
      }

      const result: Partial<Record<SyncableId, SyncableStoreBackingItemMetadata>> = {};

      // TODO: Parallelize
      for (let index = 0; index < records.length; index += 1) {
        const { id } = records[index];
        result[id] = await getMetadataFromInternalMetadata(metadataResults.value[index]);
      }

      return makeSuccess(result);
    }
  );

  /**
   * Creates a binary file at the specified path.
   */
  public readonly createBinaryFileWithPath: PRFunc<
    SyncableStoreBackingFileAccessor,
    'not-found' | 'wrong-type' | 'conflict',
    [path: SyncablePath, { data: Uint8Array; metadata: SyncableStoreBackingItemMetadata }]
  > = makeAsyncResultFunc(
    [import.meta.filename, 'createBinaryFileWithPath'],
    async (_trace: Trace, path: SyncablePath, { data, metadata }: { data: Uint8Array; metadata: SyncableStoreBackingItemMetadata }) => {
      // Convert path
      const gsPath = getGsPathFromSyncablePath(this.prefix_, path, 'item');

      // Check if file already exists TODO: Handle exceptions instead
      // const [exists] = await this.bucket_.file(gsPath).exists();
      // if (exists) {
      //   return makeFailure('conflict');
      // }

      const internalMetadata = await getInternalMetadataFromMetadata(metadata);

      // Upload the file with metadata
      await this.bucket_.file(gsPath).save(Buffer.from(data), {
        metadata: internalMetadata
      });

      // Return file accessor
      return makeSuccess<SyncableStoreBackingFileAccessor>({
        type: 'file',
        id: path.ids[path.ids.length - 1],
        // TODO: Why do we have this? Consider changing the return type of createBinaryFileWithPath()
        getBinary: async () => makeSuccess(data)
      });
    }
  );

  /**
   * Creates a folder at the specified path.
   */
  public readonly createFolderWithPath: PRFunc<
    SyncableStoreBackingFolderAccessor,
    'not-found' | 'wrong-type' | 'conflict',
    [path: SyncablePath, { metadata: SyncableStoreBackingItemMetadata }]
  > = makeAsyncResultFunc(
    [import.meta.filename, 'createFolderWithPath'],
    async (_trace: Trace, path: SyncablePath, { metadata }: { metadata: SyncableStoreBackingItemMetadata }) => {
      // Convert path
      const gsPath = getGsPathFromSyncablePath(this.prefix_, path, 'item');

      const internalMetadata = await getInternalMetadataFromMetadata(metadata);

      // Upload the folder marker with metadata
      // TODO: interpret exceptions
      await this.bucket_.file(gsPath).save('', {
        metadata: internalMetadata
      });

      // Implementation will be added later
      return makeSuccess<SyncableStoreBackingFolderAccessor>({
        // TODO: Implement this.
        //  Or better remove distinction between folders and bundles from Backing, keep it one level above
        type: 'folder',
        id: path.ids[path.ids.length - 1]
      });
    }
  );

  /**
   * Deletes the item at the specified path.
   */
  public readonly deleteAtPath: PRFunc<undefined, 'not-found' | 'wrong-type', [path: SyncablePath]> = makeAsyncResultFunc(
    [import.meta.filename, 'deleteAtPath'],
    async (trace: Trace, path: SyncablePath) => {
      // Delete the file/folder itself
      const gsPath = getGsPathFromSyncablePath(this.prefix_, path, 'item');
      const result = await this.identifyNotFound_(trace, () => this.bucket_.file(gsPath).delete());
      if (!result.ok) {
        return result;
      }

      // Delete its contents (it is a separate process)
      const gcsPrefix = getGsPathFromSyncablePath(this.prefix_, path, 'scan-recursive');
      const [files] = await this.bucket_.getFiles({
        prefix: gcsPrefix + '/'
      });

      // TODO: Parallelize this
      // Note: parallelism is limited at the connection level. See createGoogleStorageSyncableStoreBacking()
      for (const file of files) {
        await file.delete();
      }

      return makeSuccess(undefined);
    }
  );

  /**
   * Updates the local metadata for the item at the specified path.
   */
  public readonly updateLocalMetadataAtPath: PRFunc<
    undefined,
    'not-found' | 'wrong-type',
    [path: SyncablePath, metadata: Partial<LocalItemMetadata>]
  > = makeAsyncResultFunc(
    [import.meta.filename, 'updateLocalMetadataAtPath'],
    async (trace: Trace, path: SyncablePath, metadata: Partial<LocalItemMetadata>) => {
      const gsPath = getGsPathFromSyncablePath(this.prefix_, path, 'item');

      // Get current metadata
      const file = this.bucket_.file(gsPath);
      const metadataResult = await this.getGsFileMetadata_(trace, file);
      if (!metadataResult.ok) {
        return metadataResult;
      }

      // Update metadata with the new local metadata
      const updatedMetadata = await getInternalMetadataFromMetadata({
        ...(await getMetadataFromInternalMetadata(metadataResult.value)),
        ...metadata
      });

      // Save updated metadata
      await file.setMetadata(updatedMetadata);

      return makeSuccess(undefined);
    }
  );
}
