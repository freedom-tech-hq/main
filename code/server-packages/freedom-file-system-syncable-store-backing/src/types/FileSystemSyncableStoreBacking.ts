import { allResultsMapped, excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import { objectEntries } from 'freedom-cast';
import { ConflictError, generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import {
  type StaticSyncablePath,
  type SyncableBundleFileMetadata,
  type SyncableFlatFileMetadata,
  type SyncableFolderMetadata,
  type SyncableId,
  type SyncableItemMetadata,
  type SyncableItemType,
  syncableItemTypes
} from 'freedom-sync-types';
import { isExpectedType, type SyncableStoreBacking } from 'freedom-syncable-store-types';
import type { SyncableStoreBackingFlatFileAccessor } from 'freedom-syncable-store-types/lib/types/backing/accessors/SyncableStoreBackingFlatFileAccessor';
import type { SyncableStoreBackingFolderAccessor } from 'freedom-syncable-store-types/lib/types/backing/accessors/SyncableStoreBackingFolderAccessor';
import type { SyncableStoreBackingItemAccessor } from 'freedom-syncable-store-types/lib/types/backing/accessors/SyncableStoreBackingItemAccessor';
import type { LocalItemMetadata } from 'freedom-syncable-store-types/lib/types/backing/LocalItemMetadata';
import type { SingleOrArray } from 'yaschema';

import { ROOT_FOLDER_ID } from '../internal/consts/special-ids.ts';
import type { FileSystemSyncableStoreBackingFolderItem } from '../internal/types/FileSystemSyncableStoreBackingFolderItem.ts';
import { createFile } from '../internal/utils/createFile.ts';
import { createFolder } from '../internal/utils/createFolder.ts';
import { deleteFileOrFolder } from '../internal/utils/deleteFileOrFolder.ts';
import { makeContentsFuncForPath } from '../internal/utils/makeContentsFuncForPath.ts';
import { makeItemAccessor } from '../internal/utils/makeItemAccessor.ts';
import { traversePath } from '../internal/utils/traversePath.ts';
import { updateLocalMetadata } from '../internal/utils/updateLocalMetadata.ts';

export class FileSystemSyncableStoreBacking implements SyncableStoreBacking {
  private readonly root_: FileSystemSyncableStoreBackingFolderItem;
  private readonly rootPath_: string;

  constructor(rootPath: string, metadata: Omit<SyncableFolderMetadata & LocalItemMetadata, 'type' | 'encrypted'>) {
    this.rootPath_ = rootPath;
    this.root_ = {
      type: 'folder',
      id: ROOT_FOLDER_ID,
      metadata: async () => makeSuccess({ ...metadata, type: 'folder' as const, encrypted: true as const }),
      contents: makeContentsFuncForPath(rootPath, [])
    };
  }

  public readonly existsAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'existsAtPath'],
    async (trace, path: StaticSyncablePath): PR<boolean> => {
      const found = await traversePath(trace, this.root_, path);
      if (!found.ok) {
        if (found.value.errorCode === 'not-found') {
          return makeSuccess(false);
        }

        return generalizeFailureResult(trace, excludeFailureResult(found, 'not-found'), 'wrong-type');
      }

      return makeSuccess(found.value !== undefined);
    }
  );

  public readonly getAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'getAtPath'],
    async <T extends SyncableItemType = SyncableItemType>(
      trace: Trace,
      path: StaticSyncablePath,
      expectedType?: SingleOrArray<T>
    ): PR<SyncableStoreBackingItemAccessor & { type: T }, 'not-found' | 'wrong-type'> => {
      const found = await traversePath(trace, this.root_, path, expectedType);
      if (!found.ok) {
        return found;
      }

      const accessor = makeItemAccessor(trace, found.value);
      return makeSuccess(accessor as SyncableStoreBackingItemAccessor & { type: T });
    }
  );

  public readonly getIdsInPath = makeAsyncResultFunc(
    [import.meta.filename, 'getIdsInPath'],
    async (
      trace,
      path: StaticSyncablePath,
      options?: { type?: SingleOrArray<SyncableItemType> }
    ): PR<SyncableId[], 'not-found' | 'wrong-type'> => {
      const found = await traversePath(trace, this.root_, path, syncableItemTypes.exclude('flatFile'));
      if (!found.ok) {
        return found;
      }

      const contents = await found.value.contents(trace);
      if (!contents.ok) {
        return contents;
      }

      const ids: SyncableId[] = [];

      const didFilterIds = await allResultsMapped(trace, objectEntries(contents.value), {}, async (trace, [id, item]) => {
        if (item === undefined) {
          return makeSuccess(undefined);
        }

        const metadata = await item.metadata(trace);
        if (!metadata.ok) {
          return metadata;
        }

        const isExpected = isExpectedType(trace, metadata.value, options?.type);
        if (isExpected.ok && isExpected.value) {
          ids.push(id);
        }

        return makeSuccess(undefined);
      });
      if (!didFilterIds.ok) {
        return didFilterIds;
      }

      return makeSuccess(ids);
    }
  );

  public readonly getMetadataAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'getMetadataAtPath'],
    async (trace, path: StaticSyncablePath): PR<SyncableItemMetadata & LocalItemMetadata, 'not-found' | 'wrong-type'> => {
      if (path.ids.length === 0) {
        return await this.root_.metadata(trace);
      }

      const id = path.lastId!;
      const metadataById = await this.getMetadataByIdInPath(trace, path.parentPath!, new Set([id]));
      if (!metadataById.ok) {
        return metadataById;
      }

      if (metadataById.value[id] === undefined) {
        return makeFailure(new NotFoundError(trace, { message: `No metadata found for ${path.toString()}`, errorCode: 'not-found' }));
      }

      return makeSuccess(metadataById.value[id]);
    }
  );

  public readonly getMetadataByIdInPath = makeAsyncResultFunc(
    [import.meta.filename, 'getMetadataByIdInPath'],
    async (
      trace,
      path: StaticSyncablePath,
      ids?: Set<SyncableId>
    ): PR<Partial<Record<SyncableId, SyncableItemMetadata & LocalItemMetadata>>, 'not-found' | 'wrong-type'> => {
      const found = await traversePath(trace, this.root_, path, syncableItemTypes.exclude('flatFile'));
      if (!found.ok) {
        return found;
      }

      const contents = await found.value.contents(trace);
      if (!contents.ok) {
        return contents;
      }

      const metadataById: Partial<Record<SyncableId, SyncableItemMetadata & LocalItemMetadata>> = {};
      const didFilterIds = await allResultsMapped(trace, objectEntries(contents.value), {}, async (trace, [id, item]) => {
        if (item === undefined) {
          return makeSuccess(undefined);
        }

        if (ids === undefined || ids.has(id)) {
          const metadata = await item.metadata(trace);
          if (!metadata.ok) {
            return metadata;
          }

          metadataById[id] = metadata.value;
        }

        return makeSuccess(undefined);
      });
      if (!didFilterIds.ok) {
        return didFilterIds;
      }
      return makeSuccess(metadataById);
    }
  );

  public readonly createBinaryFileWithPath = makeAsyncResultFunc(
    [import.meta.filename, 'createBinaryFileWithPath'],
    async (
      trace,
      path: StaticSyncablePath,
      { data, metadata }: { data: Uint8Array; metadata: SyncableFlatFileMetadata & LocalItemMetadata }
    ): PR<SyncableStoreBackingFlatFileAccessor, 'not-found' | 'wrong-type' | 'conflict'> => {
      const parentPath = path.parentPath;
      if (parentPath === undefined) {
        return makeFailure(new ConflictError(trace, { message: 'Expected a parent path' }));
      }

      const foundParent = await traversePath(trace, this.root_, parentPath, syncableItemTypes.exclude('flatFile'));
      if (!foundParent.ok) {
        return foundParent;
      }

      const contents = await foundParent.value.contents(trace);
      if (!contents.ok) {
        return contents;
      }

      if (contents.value[path.lastId!] !== undefined) {
        return makeFailure(new ConflictError(trace, { message: `${path.toString()} already exists`, errorCode: 'conflict' }));
      }

      const saved = await createFile(trace, this.rootPath_, path.ids, data, metadata);
      if (!saved.ok) {
        return saved;
      }

      return await this.getAtPath(trace, path, 'flatFile');
    }
  );

  public readonly createFolderWithPath = makeAsyncResultFunc(
    [import.meta.filename, 'createFolderWithPath'],
    async (
      trace,
      path: StaticSyncablePath,
      { metadata }: { metadata: (SyncableBundleFileMetadata | SyncableFolderMetadata) & LocalItemMetadata }
    ): PR<SyncableStoreBackingFolderAccessor, 'not-found' | 'wrong-type' | 'conflict'> => {
      const parentPath = path.parentPath;
      if (parentPath === undefined) {
        return makeFailure(new ConflictError(trace, { message: 'Expected a parent path' }));
      }

      const foundParent = await traversePath(trace, this.root_, parentPath, syncableItemTypes.exclude('flatFile'));
      if (!foundParent.ok) {
        return foundParent;
      }

      const contents = await foundParent.value.contents(trace);
      if (!contents.ok) {
        return contents;
      }

      if (contents.value[path.lastId!] !== undefined) {
        return makeFailure(new ConflictError(trace, { message: `${path.toString()} already exists`, errorCode: 'conflict' }));
      }

      const saved = await createFolder(trace, this.rootPath_, path.ids, metadata);
      if (!saved.ok) {
        return saved;
      }

      return await this.getAtPath(trace, path, 'folder');
    }
  );

  public readonly deleteAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'deleteAtPath'],
    async (trace, path: StaticSyncablePath): PR<undefined, 'not-found' | 'wrong-type'> => {
      const parentPath = path.parentPath;
      if (parentPath === undefined) {
        return makeFailure(new ConflictError(trace, { message: 'Expected a parent path' }));
      }

      const foundParent = await traversePath(trace, this.root_, parentPath, syncableItemTypes.exclude('flatFile'));
      if (!foundParent.ok) {
        return foundParent;
      }

      const deleted = await deleteFileOrFolder(trace, this.rootPath_, path.ids);
      if (!deleted.ok) {
        return deleted;
      }

      return makeSuccess(undefined);
    }
  );

  public readonly updateLocalMetadataAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'updateLocalMetadataAtPath'],
    async (trace, path: StaticSyncablePath, metadata: Partial<LocalItemMetadata>): PR<undefined, 'not-found' | 'wrong-type'> => {
      const found = await traversePath(trace, this.root_, path);
      if (!found.ok) {
        return found;
      }

      if ('hash' in metadata) {
        const updated = await updateLocalMetadata(trace, this.rootPath_, path.ids, { hash: metadata.hash });
        if (!updated.ok) {
          return updated;
        }
      }

      return makeSuccess(undefined);
    }
  );
}
