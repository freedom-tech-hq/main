import type { PR } from 'freedom-async';
import { allResultsMapped, GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { objectEntries, objectKeys } from 'freedom-cast';
import { generalizeFailureResult, InternalStateError, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { LocalItemMetadata, SyncableId, SyncableItemMetadata, SyncableItemType, SyncablePath } from 'freedom-sync-types';
import { extractSyncableItemTypeFromId, isCompleteLocalItemMetadata } from 'freedom-sync-types';
import { guardIsExpectedType, type SyncableStoreBacking } from 'freedom-syncable-store-backing-types';
import type {
  GenerateNewSyncableItemNameFunc,
  LsFormatterArgs,
  MutableStoreBase,
  MutableSyncableBundleAccessor,
  MutableSyncableFileAccessor,
  MutableSyncableFolderAccessor,
  MutableSyncableItemAccessor,
  MutableSyncableStore,
  SyncableItemAccessor,
  SyncTracker
} from 'freedom-syncable-store-types';
import { flatten } from 'lodash-es';
import type { SingleOrArray } from 'yaschema';

import { guardIsSyncableItemTrusted } from '../../utils/guards/guardIsSyncableItemTrusted.ts';
import { defaultLsFormatter } from '../consts/ls.ts';
import { intersectSyncableItemTypes } from '../utils/intersectSyncableItemTypes.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';

export interface DefaultStoreBaseConstructorArgs {
  store: MutableSyncableStore;
  backing: SyncableStoreBacking;
  syncTracker: SyncTracker;
  folderOperationsHandler: FolderOperationsHandler;
  path: SyncablePath;
  supportedItemTypes: SingleOrArray<SyncableItemType>;
}

export abstract class DefaultStoreBase implements MutableStoreBase {
  protected readonly weakStore_: WeakRef<MutableSyncableStore>;
  protected readonly syncTracker_: SyncTracker;
  protected readonly folderOperationsHandler_: FolderOperationsHandler;

  protected readonly path_: SyncablePath;
  protected readonly backing_: SyncableStoreBacking;

  protected abstract makeFolderAccessor_(args: { path: SyncablePath }): MutableSyncableFolderAccessor;
  protected abstract makeBundleAccessor_(args: { path: SyncablePath }): MutableSyncableBundleAccessor;
  protected abstract makeFileAccessor_(args: { path: SyncablePath }): MutableSyncableFileAccessor;

  private readonly supportedItemTypes_: SingleOrArray<SyncableItemType>;

  constructor({ store, backing, syncTracker, folderOperationsHandler, path, supportedItemTypes }: DefaultStoreBaseConstructorArgs) {
    this.weakStore_ = new WeakRef(store);
    this.backing_ = backing;
    this.syncTracker_ = syncTracker;
    this.folderOperationsHandler_ = folderOperationsHandler;
    this.path_ = path;
    this.supportedItemTypes_ = supportedItemTypes;
  }

  public readonly delete = makeAsyncResultFunc(
    [import.meta.filename, 'delete'],
    async (trace, _id: SyncableId): PR<undefined, 'not-found'> => {
      // TODO: reimplement
      return makeFailure(new GeneralError(trace, { message: 'delete is not supported' }));
      // const removePath = this.path.append(id);

      // DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'delete', pathString: removePath.toString() });

      // if (!this.supportsDeletion) {
      //   return makeFailure(new InternalStateError(trace, { message: `Deletion is not supported in ${this.path.toString()}` }));
      // }

      // // Checking that the requested file exists in the backing
      // const exists = await this.backing_.existsAtPath(trace, removePath);
      // /* node:coverage disable */
      // if (!exists.ok) {
      //   return exists;
      // } else if (!exists.value) {
      //   return makeFailure(
      //     new NotFoundError(trace, {
      //       message: `No file found for ID: ${id} in ${this.path.toString()}`,
      //       errorCode: 'not-found'
      //     })
      //   );
      // }
      // /* node:coverage enable */

      // const isDeleted = await this.folderOperationsHandler_.isPathMarkedAsDeleted(trace, removePath);
      // if (!isDeleted.ok) {
      //   return isDeleted;
      // } else if (isDeleted.value) {
      //   // Already deleted
      //   return makeSuccess(undefined);
      // }

      // const markedAsDeleted = await this.folderOperationsHandler_.markPathAsDeleted(trace, removePath);
      // /* node:coverage disable */
      // if (!markedAsDeleted.ok) {
      //   return markedAsDeleted;
      // }
      // /* node:coverage enable */

      // // Note: the actual files aren't deleted directly.  Only when the approval of the deletion change is detected will the data actually
      // // be removed

      // return makeSuccess(undefined);
    }
  );

  public readonly exists = makeAsyncResultFunc([import.meta.filename, 'exists'], async (trace, id: SyncableId): PR<boolean> => {
    const checkingPath = this.path_.append(id);

    DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'check-exists', pathString: checkingPath.toString() });

    // Checking that the requested file exists in the backing
    const exists = await this.backing_.existsAtPath(trace, checkingPath);
    /* node:coverage disable */
    if (!exists.ok) {
      return exists;
    } else if (!exists.value) {
      return makeSuccess(false);
    }
    /* node:coverage enable */

    return makeSuccess(true);
  });

  public readonly generateNewSyncableItemName: GenerateNewSyncableItemNameFunc = (trace, args) =>
    this.folderOperationsHandler_.generateNewSyncableItemName(trace, args);

  public readonly get = makeAsyncResultFunc(
    [import.meta.filename, 'get'],
    async <T extends SyncableItemType = SyncableItemType>(
      trace: Trace,
      id: SyncableId,
      expectedType?: SingleOrArray<T>
    ): PR<SyncableItemAccessor & { type: T }, 'not-found' | 'untrusted' | 'wrong-type'> => await this.getMutable(trace, id, expectedType)
  );

  public readonly getIds = makeAsyncResultFunc(
    [import.meta.filename, 'getIds'],
    async (trace: Trace, options?: { type?: SingleOrArray<SyncableItemType> }): PR<SyncableId[]> => {
      const ids = await this.backing_.getIdsInPath(trace, this.path_, {
        type: intersectSyncableItemTypes(options?.type, this.supportedItemTypes_)
      });
      if (!ids.ok) {
        return generalizeFailureResult(trace, ids, ['not-found', 'wrong-type']);
      }

      return makeSuccess(ids.value);
    }
  );

  public readonly getMetadataById = makeAsyncResultFunc(
    [import.meta.filename, 'getMetadataById'],
    async (trace: Trace): PR<Partial<Record<SyncableId, SyncableItemMetadata & LocalItemMetadata>>> => {
      // Deleted files are already filtered out using getIds
      const ids = await this.getIds(trace);
      /* node:coverage disable */
      if (!ids.ok) {
        return ids;
      }
      /* node:coverage enable */

      const metadataByIds = await this.backing_.getMetadataByIdInPath(trace, this.path_, new Set(ids.value));
      if (!metadataByIds.ok) {
        return generalizeFailureResult(trace, metadataByIds, ['not-found', 'wrong-type']);
      }

      const idsWithMissingLocalItemMetadata = new Set(
        objectKeys(metadataByIds.value).filter(
          (id) => metadataByIds.value[id] === undefined || !isCompleteLocalItemMetadata(metadataByIds.value[id])
        )
      );
      if (idsWithMissingLocalItemMetadata.size === 0) {
        return makeSuccess(metadataByIds.value as Partial<Record<SyncableId, SyncableItemMetadata & LocalItemMetadata>>);
      }

      const injectedMissingLocalItemMetadata = await allResultsMapped(
        trace,
        objectEntries(metadataByIds.value),
        {},
        async (trace, [itemId, outMetadata]): PR<undefined> => {
          if (outMetadata === undefined || !idsWithMissingLocalItemMetadata.has(itemId)) {
            return makeSuccess(undefined);
          }

          const getPath = this.path_.append(itemId);

          const itemType = extractSyncableItemTypeFromId(itemId);
          const itemAccessor = this.makeItemAccessor_(getPath, itemType);

          const completeMetadata = await itemAccessor.getMetadata(trace);
          if (!completeMetadata.ok) {
            return completeMetadata;
          }

          // Updating previously fetched metadata
          metadataByIds.value[itemId] = { ...outMetadata, ...completeMetadata.value };

          return makeSuccess(undefined);
        }
      );
      if (!injectedMissingLocalItemMetadata.ok) {
        return injectedMissingLocalItemMetadata;
      }

      return makeSuccess(metadataByIds.value as Partial<Record<SyncableId, SyncableItemMetadata & LocalItemMetadata>>);
    }
  );

  public readonly getMutable = makeAsyncResultFunc(
    [import.meta.filename, 'getMutable'],
    async <T extends SyncableItemType = SyncableItemType>(
      trace: Trace,
      id: SyncableId,
      expectedType?: SingleOrArray<T>
    ): PR<MutableSyncableItemAccessor & { type: T }, 'not-found' | 'untrusted' | 'wrong-type'> => {
      const getPath = this.path_.append(id);

      this.syncTracker_.notify('itemAccessed', { path: getPath });

      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      const itemType = extractSyncableItemTypeFromId(id);
      const guards = guardIsExpectedType(trace, getPath, itemType, expectedType, 'wrong-type');
      if (!guards.ok) {
        return guards;
      }

      const exists = await this.exists(trace, id);
      if (!exists.ok) {
        return exists;
      } else if (!exists.value) {
        this.syncTracker_.notify('itemNotFound', { path: getPath });
        return makeFailure(new NotFoundError(trace, { message: `${getPath.toString()} not found`, errorCode: 'not-found' }));
      }

      const item = this.makeMutableItemAccessor_<T>(getPath, itemType as T);

      const trustGuard = await guardIsSyncableItemTrusted(trace, store, item);
      if (!trustGuard.ok) {
        return trustGuard;
      }

      return makeSuccess(item);
    }
  );

  public readonly isDeleted = makeAsyncResultFunc([import.meta.filename, 'isDeleted'], async (_trace, _id: SyncableId): PR<boolean> => {
    // TODO: reimplement
    return makeSuccess(false);
    // if (!this.supportsDeletion) {
    //   return makeSuccess(false);
    // }

    // const isDeleted = await this.folderOperationsHandler_.isPathMarkedAsDeleted(trace, this.path.append(id));
    // if (!isDeleted.ok) {
    //   return isDeleted;
    // }

    // return makeSuccess(isDeleted.value);
  });

  public readonly ls = makeAsyncResultFunc([import.meta.filename, 'ls'], async (trace, options?: LsFormatterArgs): PR<string[]> => {
    const metadataById = await this.getMetadataById(trace);
    if (!metadataById.ok) {
      return metadataById;
    }

    const recursiveLs = await allResultsMapped(
      trace,
      objectEntries(metadataById.value).sort(),
      {},
      async (trace, [itemId, metadata]): PR<string[]> => {
        if (metadata === undefined) {
          return makeSuccess([]);
        }

        const itemPath = this.path_.append(itemId);

        const dynamicName = await this.folderOperationsHandler_.getDynamicName(trace, metadata.name);
        const lsFormatter = options?.formatter ?? defaultLsFormatter;
        const itemType = extractSyncableItemTypeFromId(itemId);

        const output: string[] = [
          lsFormatter({
            itemType,
            itemId,
            metadata,
            dynamicName: dynamicName.ok ? dynamicName.value : undefined
          })
        ];

        switch (itemType) {
          case 'bundle':
          case 'folder': {
            const itemAccessor = this.makeItemAccessor_(itemPath, itemType);
            const fileLs = await itemAccessor.ls(trace, options);
            if (!fileLs.ok) {
              return fileLs;
            }
            // Indenting
            output.push(...fileLs.value.map((value) => `  ${value}`));

            break;
          }
          case 'file':
            break; // Nothing to do
        }

        return makeSuccess(output);
      }
    );
    if (!recursiveLs.ok) {
      return recursiveLs;
    }

    return makeSuccess(flatten(recursiveLs.value));
  });

  // Protected Methods

  protected makeItemAccessor_<T extends SyncableItemType>(path: SyncablePath, itemType: T): SyncableItemAccessor & { type: T } {
    return this.makeMutableItemAccessor_<T>(path, itemType);
  }

  protected makeMutableItemAccessor_<T extends SyncableItemType>(
    path: SyncablePath,
    itemType: T
  ): MutableSyncableItemAccessor & { type: T } {
    switch (itemType) {
      case 'folder':
        return this.makeFolderAccessor_({ path }) as any as MutableSyncableItemAccessor & { type: T };

      case 'bundle':
        return this.makeBundleAccessor_({ path }) as any as MutableSyncableItemAccessor & { type: T };

      case 'file':
        return this.makeFileAccessor_({ path }) as any as MutableSyncableItemAccessor & { type: T };
    }
  }
}
