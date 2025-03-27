import { excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import { objectEntries } from 'freedom-cast';
import { ConflictError, generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import {
  type StaticSyncablePath,
  type SyncableBundleMetadata,
  type SyncableFileMetadata,
  type SyncableFolderMetadata,
  type SyncableId,
  type SyncableItemMetadata,
  type SyncableItemType,
  syncableItemTypes
} from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

import { isExpectedType } from '../../utils/validation/isExpectedType.ts';
import type { SyncableStoreBackingFileAccessor } from '../backing/accessors/SyncableStoreBackingFileAccessor.ts';
import type { SyncableStoreBackingFolderAccessor } from '../backing/accessors/SyncableStoreBackingFolderAccessor.ts';
import type { SyncableStoreBackingItemAccessor } from '../backing/accessors/SyncableStoreBackingItemAccessor.ts';
import type { SyncableStoreBacking } from '../backing/SyncableStoreBacking.ts';
import type { LocalItemMetadata } from '../LocalItemMetadata.ts';
import { ROOT_FOLDER_ID } from './internal/consts/special-ids.ts';
import type { InMemorySyncableStoreBackingFileItem } from './internal/types/InMemorySyncableStoreBackingFileItem.ts';
import type { InMemorySyncableStoreBackingFolderItem } from './internal/types/InMemorySyncableStoreBackingFolderItem.ts';
import { makeFileAccessor } from './internal/utils/makeFileAccessor.ts';
import { makeFolderAccessor } from './internal/utils/makeFolderAccessor.ts';
import { makeItemAccessor } from './internal/utils/makeItemAccessor.ts';
import { traversePath } from './internal/utils/traversePath.ts';

export class InMemorySyncableStoreBacking implements SyncableStoreBacking {
  private readonly root_: InMemorySyncableStoreBackingFolderItem;

  constructor(metadata: Omit<SyncableFolderMetadata & LocalItemMetadata, 'type' | 'encrypted'>) {
    this.root_ = {
      type: 'folder',
      id: ROOT_FOLDER_ID,
      metadata: { ...metadata, type: 'folder', encrypted: true },
      contents: {}
    };
  }

  public readonly existsAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'existsAtPath'],
    async (trace, path: StaticSyncablePath): PR<boolean> => {
      const found = traversePath(trace, this.root_, path);
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
      const found = traversePath(trace, this.root_, path, expectedType);
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
      const found = traversePath(trace, this.root_, path, syncableItemTypes.exclude('file'));
      if (!found.ok) {
        return found;
      }

      const ids = objectEntries(found.value.contents)
        .filter(([_id, item]) => {
          if (item === undefined) {
            return false;
          }

          const isExpected = isExpectedType(trace, item.metadata, options?.type);
          return isExpected.ok && isExpected.value;
        })
        .map(([id, _item]) => id);
      return makeSuccess(ids);
    }
  );

  public readonly getMetadataAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'getMetadataAtPath'],
    async (trace, path: StaticSyncablePath): PR<SyncableItemMetadata & LocalItemMetadata, 'not-found' | 'wrong-type'> => {
      if (path.ids.length === 0) {
        return makeSuccess(this.root_.metadata);
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
      const found = traversePath(trace, this.root_, path, syncableItemTypes.exclude('file'));
      if (!found.ok) {
        return found;
      }

      const metadataById = objectEntries(found.value.contents)
        .filter(([id, item]) => {
          if (item === undefined) {
            return false;
          }

          return ids === undefined || ids.has(id);
        })
        .reduce(
          (out, [id, item]) => {
            out[id] = item!.metadata;
            return out;
          },
          {} as Partial<Record<SyncableId, SyncableItemMetadata & LocalItemMetadata>>
        );
      return makeSuccess(metadataById);
    }
  );

  public readonly createBinaryFileWithPath = makeAsyncResultFunc(
    [import.meta.filename, 'createBinaryFileWithPath'],
    async (
      trace,
      path: StaticSyncablePath,
      { data, metadata }: { data: Uint8Array; metadata: SyncableFileMetadata & LocalItemMetadata }
    ): PR<SyncableStoreBackingFileAccessor, 'not-found' | 'wrong-type' | 'conflict'> => {
      const parentPath = path.parentPath;
      if (parentPath === undefined) {
        return makeFailure(new ConflictError(trace, { message: 'Expected a parent path' }));
      }

      const foundParent = traversePath(trace, this.root_, parentPath, syncableItemTypes.exclude('file'));
      if (!foundParent.ok) {
        return foundParent;
      }

      if (foundParent.value.contents[path.lastId!] !== undefined) {
        return makeFailure(new ConflictError(trace, { message: `${path.toString()} already exists`, errorCode: 'conflict' }));
      }

      const newItem: InMemorySyncableStoreBackingFileItem = {
        type: 'file',
        id: path.lastId!,
        metadata,
        data
      };
      foundParent.value.contents[path.lastId!] = newItem;

      return makeSuccess(makeFileAccessor(trace, newItem));
    }
  );

  public readonly createFolderWithPath = makeAsyncResultFunc(
    [import.meta.filename, 'createFolderWithPath'],
    async (
      trace,
      path: StaticSyncablePath,
      { metadata }: { metadata: (SyncableBundleMetadata | SyncableFolderMetadata) & LocalItemMetadata }
    ): PR<SyncableStoreBackingFolderAccessor, 'not-found' | 'wrong-type' | 'conflict'> => {
      const parentPath = path.parentPath;
      if (parentPath === undefined) {
        return makeFailure(new ConflictError(trace, { message: 'Expected a parent path' }));
      }

      const foundParent = traversePath(trace, this.root_, parentPath, syncableItemTypes.exclude('file'));
      if (!foundParent.ok) {
        return foundParent;
      }

      if (foundParent.value.contents[path.lastId!] !== undefined) {
        return makeFailure(new ConflictError(trace, { message: `${path.toString()} already exists`, errorCode: 'conflict' }));
      }

      const newItem: InMemorySyncableStoreBackingFolderItem = {
        type: 'folder',
        id: path.lastId!,
        metadata,
        contents: {}
      };
      foundParent.value.contents[path.lastId!] = newItem;

      return makeSuccess(makeFolderAccessor(trace, newItem));
    }
  );

  public readonly deleteAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'deleteAtPath'],
    async (trace, path: StaticSyncablePath): PR<undefined, 'not-found' | 'wrong-type'> => {
      const parentPath = path.parentPath;
      if (parentPath === undefined) {
        return makeFailure(new ConflictError(trace, { message: 'Expected a parent path' }));
      }

      const foundParent = traversePath(trace, this.root_, parentPath, syncableItemTypes.exclude('file'));
      if (!foundParent.ok) {
        return foundParent;
      }

      delete foundParent.value.contents[path.lastId!];

      return makeSuccess(undefined);
    }
  );

  public readonly updateLocalMetadataAtPath = makeAsyncResultFunc(
    [import.meta.filename, 'updateLocalMetadataAtPath'],
    async (trace, path: StaticSyncablePath, metadata: Partial<LocalItemMetadata>): PR<undefined, 'not-found' | 'wrong-type'> => {
      const found = traversePath(trace, this.root_, path);
      if (!found.ok) {
        return found;
      }

      if ('hash' in metadata) {
        found.value.metadata.hash = metadata.hash;
      }

      return makeSuccess(undefined);
    }
  );
}
