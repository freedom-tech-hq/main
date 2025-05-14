import { allResultsMapped, excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import { objectEntries, objectKeys } from 'freedom-cast';
import { ConflictError, generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { LocalItemMetadata, SyncableId, SyncableItemType, SyncablePath } from 'freedom-sync-types';
import { extractSyncableItemTypeFromId, folderLikeSyncableItemTypes } from 'freedom-sync-types';
import type {
  SyncableStoreBacking,
  SyncableStoreBackingFileAccessor,
  SyncableStoreBackingFolderAccessor,
  SyncableStoreBackingItemAccessor,
  SyncableStoreBackingItemMetadata
} from 'freedom-syncable-store-backing-types';
import { isExpectedType } from 'freedom-syncable-store-backing-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import type { SingleOrArray } from 'yaschema';

import { ROOT_FOLDER_ID } from '../internal/consts/special-ids.ts';
import type { FileSystemSyncableStoreBackingFolderItem } from '../internal/types/FileSystemSyncableStoreBackingFolderItem.ts';
import { createFile } from '../internal/utils/createFile.ts';
import { createFolder } from '../internal/utils/createFolder.ts';
import { createMetadataFile } from '../internal/utils/createMetadataFile.ts';
import { deleteFileOrFolder } from '../internal/utils/deleteFileOrFolder.ts';
import { makeContentsFuncForPath } from '../internal/utils/makeContentsFuncForPath.ts';
import { makeExistsFuncForFolderPath } from '../internal/utils/makeExistsFuncForFolderPath.ts';
import { makeFolderMetaFuncForPath } from '../internal/utils/makeFolderMetaFuncForPath.ts';
import { makeGetFuncForPath } from '../internal/utils/makeGetFuncForPath.ts';
import { makeItemAccessor } from '../internal/utils/makeItemAccessor.ts';
import { traversePath } from '../internal/utils/traversePath.ts';
import { updateLocalMetadata } from '../internal/utils/updateLocalMetadata.ts';

export class FileSystemSyncableStoreBacking implements SyncableStoreBacking {
  private root_: FileSystemSyncableStoreBackingFolderItem;
  private readonly rootPath_: string;

  constructor(rootPath: string) {
    this.rootPath_ = rootPath;
    this.root_ = {
      type: 'folder',
      id: ROOT_FOLDER_ID,
      exists: makeExistsFuncForFolderPath(this.rootPath_, []),
      get: makeGetFuncForPath(this.rootPath_, []),
      metadata: makeFolderMetaFuncForPath(this.rootPath_, []),
      contents: makeContentsFuncForPath(this.rootPath_, [])
    };
  }

  /** Initializes the backing for use.  This must be done exactly once for newly-created backings. */
  public readonly initialize = makeAsyncResultFunc(
    [import.meta.filename, 'initialize'],
    async (trace, metadata: Omit<SyncableStoreBackingItemMetadata, 'name'>) => {
      const savedMetadata = await createMetadataFile(trace, this.rootPath_, [], { ...metadata, name: ROOT_FOLDER_ID });
      if (!savedMetadata.ok) {
        return savedMetadata;
      }

      return makeSuccess(undefined);
    }
  );

  public readonly existsAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'existsAtPath'],
    async (trace, path: SyncablePath): PR<boolean> => {
      const found = await disableLam('not-found', traversePath)(trace, this.root_, path);
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
      path: SyncablePath,
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
      path: SyncablePath,
      options?: { type?: SingleOrArray<SyncableItemType> }
    ): PR<SyncableId[], 'not-found' | 'wrong-type'> => {
      const found = await traversePath(trace, this.root_, path, folderLikeSyncableItemTypes);
      if (!found.ok) {
        return found;
      }

      const contents = await found.value.contents(trace);
      if (!contents.ok) {
        return contents;
      }

      // TODO: should also check if options type includes all of the types
      if (options?.type === undefined) {
        return makeSuccess(objectKeys(contents.value));
      }

      const ids: SyncableId[] = objectKeys(contents.value).filter((id) => {
        const itemType = extractSyncableItemTypeFromId(id);
        const isExpected = isExpectedType(trace, itemType, options?.type);
        return isExpected.ok && isExpected.value;
      });

      return makeSuccess(ids);
    }
  );

  public readonly getMetadataAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'getMetadataAtPath'],
    async (trace, path: SyncablePath): PR<SyncableStoreBackingItemMetadata, 'not-found' | 'wrong-type'> => {
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
      path: SyncablePath,
      ids?: Set<SyncableId>
    ): PR<Partial<Record<SyncableId, SyncableStoreBackingItemMetadata>>, 'not-found' | 'wrong-type'> => {
      const found = await traversePath(trace, this.root_, path, folderLikeSyncableItemTypes);
      if (!found.ok) {
        return found;
      }

      const contents = await found.value.contents(trace);
      if (!contents.ok) {
        return contents;
      }

      const metadataById: Partial<Record<SyncableId, SyncableStoreBackingItemMetadata>> = {};
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
      path: SyncablePath,
      { data, metadata }: { data: Uint8Array; metadata: SyncableStoreBackingItemMetadata }
    ): PR<SyncableStoreBackingFileAccessor, 'not-found' | 'wrong-type' | 'conflict'> => {
      const parentPath = path.parentPath;
      if (parentPath === undefined) {
        return makeFailure(new ConflictError(trace, { message: 'Expected a parent path' }));
      }

      const foundParent = await traversePath(trace, this.root_, parentPath, folderLikeSyncableItemTypes);
      if (!foundParent.ok) {
        return foundParent;
      }

      const exists = await foundParent.value.exists(trace, path.lastId!);
      if (!exists.ok) {
        return exists;
      } else if (exists.value) {
        return makeFailure(new ConflictError(trace, { message: `${path.toString()} already exists`, errorCode: 'conflict' }));
      }

      const saved = await createFile(trace, this.rootPath_, path.ids, data, metadata);
      if (!saved.ok) {
        return saved;
      }

      return await this.getAtPath(trace, path, 'file');
    }
  );

  public readonly createFolderWithPath = makeAsyncResultFunc(
    [import.meta.filename, 'createFolderWithPath'],
    async (
      trace,
      path: SyncablePath,
      { metadata }: { metadata: SyncableStoreBackingItemMetadata }
    ): PR<SyncableStoreBackingFolderAccessor, 'not-found' | 'wrong-type' | 'conflict'> => {
      const parentPath = path.parentPath;
      if (parentPath === undefined) {
        return makeFailure(new ConflictError(trace, { message: 'Expected a parent path' }));
      }

      const foundParent = await traversePath(trace, this.root_, parentPath, folderLikeSyncableItemTypes);
      if (!foundParent.ok) {
        return foundParent;
      }

      const exists = await foundParent.value.exists(trace, path.lastId!);
      if (!exists.ok) {
        return exists;
      } else if (exists.value) {
        return makeFailure(new ConflictError(trace, { message: `${path.toString()} already exists`, errorCode: 'conflict' }));
      }

      const saved = await createFolder(trace, this.rootPath_, path.ids, metadata);
      if (!saved.ok) {
        return saved;
      }

      return await this.getAtPath(trace, path, folderLikeSyncableItemTypes);
    }
  );

  public readonly deleteAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'deleteAtPath'],
    async (trace, path: SyncablePath): PR<undefined, 'not-found' | 'wrong-type'> => {
      const parentPath = path.parentPath;
      if (parentPath === undefined) {
        return makeFailure(new ConflictError(trace, { message: 'Expected a parent path' }));
      }

      const foundParent = await traversePath(trace, this.root_, parentPath, folderLikeSyncableItemTypes);
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
    async (trace, path: SyncablePath, metadataChanges: Partial<LocalItemMetadata>): PR<undefined, 'not-found' | 'wrong-type'> => {
      const found = await traversePath(trace, this.root_, path);
      if (!found.ok) {
        return found;
      }

      return await updateLocalMetadata(trace, this.rootPath_, path.ids, metadataChanges);
    }
  );
}
