import type { PR, PRFunc, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { DynamicSyncableItemName, LocalItemMetadata, SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import { extractSyncableItemTypeFromId, isCompleteLocalItemMetadata, mergeLocalItemMetadata } from 'freedom-sync-types';
import type { SyncableStoreBacking } from 'freedom-syncable-store-backing-types';
import type { MutableSyncableItemAccessorBase, MutableSyncableStore } from 'freedom-syncable-store-types';

import { getNearestFolder } from '../../utils/get/getNearestFolder.ts';
import { getNearestFolderPath } from '../../utils/get/getNearestFolderPath.ts';
import { markSyncableNeedsRecomputeLocalMetadataAtPath } from '../utils/markSyncableNeedsRecomputeLocalMetadataAtPath.ts';
import { DefaultMutableSyncableFolderAccessor } from './DefaultMutableSyncableFolderAccessor.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';

export interface DefaultMutableSyncableItemAccessorBaseConstructorArgs {
  backing: SyncableStoreBacking;
  path: SyncablePath;
}

export abstract class DefaultMutableSyncableItemAccessorBase implements MutableSyncableItemAccessorBase {
  public readonly path: SyncablePath;

  protected readonly backing_: SyncableStoreBacking;
  protected weakStore_!: WeakRef<MutableSyncableStore>;
  protected folderOperationsHandler_!: FolderOperationsHandler;

  private needsRecomputeLocalMetadataCount_ = 0;

  constructor({ backing, path }: DefaultMutableSyncableItemAccessorBaseConstructorArgs) {
    this.backing_ = backing;
    this.path = path;
  }

  protected deferredDefaultMutableSyncableItemAccessorBaseInit_({
    store,
    folderOperationsHandler
  }: {
    store: MutableSyncableStore;
    folderOperationsHandler: FolderOperationsHandler;
  }) {
    this.weakStore_ = new WeakRef(store);
    this.folderOperationsHandler_ = folderOperationsHandler;
  }

  // Abstract Methods

  protected abstract computeLocalItemMetadata_: PRFunc<LocalItemMetadata>;

  // MutableSyncableItemAccessorBase Methods

  public readonly getMetadata = makeAsyncResultFunc(
    [import.meta.filename, 'getMetadata'],
    async (trace): PR<SyncableItemMetadata & LocalItemMetadata> => {
      DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'get-metadata', pathString: this.path.toString() });

      const metadata = await this.backing_.getMetadataAtPath(trace, this.path);
      if (!metadata.ok) {
        return generalizeFailureResult(trace, metadata, ['not-found', 'wrong-type']);
      }

      if (isCompleteLocalItemMetadata(metadata.value)) {
        return makeSuccess(metadata.value);
      }

      const localItemMetadata = await this.computeLocalItemMetadataAndUpdateBacking_(trace);
      if (!localItemMetadata.ok) {
        return localItemMetadata;
      }

      mergeLocalItemMetadata(metadata.value, localItemMetadata.value);

      return makeSuccess(metadata.value as SyncableItemMetadata & LocalItemMetadata);
    }
  );

  public readonly getName = makeAsyncResultFunc([import.meta.filename, 'getName'], async (trace): PR<string> => {
    const metadata = await this.getMetadata(trace);
    if (!metadata.ok) {
      return metadata;
    }

    if (this.path.lastId === undefined) {
      return makeSuccess('');
    }

    let dynamicName: Result<DynamicSyncableItemName>;

    if (extractSyncableItemTypeFromId(this.path.lastId) === 'folder') {
      // The names of folders belong to the folders that contain them, not to the folders themselves

      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      const parentFolder = await getNearestFolder(trace, store, getNearestFolderPath(this.path).parentPath!);
      if (!parentFolder.ok) {
        return generalizeFailureResult(trace, parentFolder, ['not-found', 'untrusted', 'wrong-type']);
      }

      if (!(parentFolder.value instanceof DefaultMutableSyncableFolderAccessor)) {
        return makeFailure(new InternalStateError(trace, { message: 'parent folder is not a DefaultMutableSyncableFolderAccessor' }));
      }

      dynamicName = await parentFolder.value.folderOperationsHandler_.getDynamicName(trace, metadata.value.name);
    } else {
      // All other items are contained in folders, so their names belong to the nearest folder

      dynamicName = await this.folderOperationsHandler_.getDynamicName(trace, metadata.value.name);
    }

    if (!dynamicName.ok) {
      return dynamicName;
    }

    if (typeof dynamicName.value === 'string') {
      return makeSuccess(dynamicName.value);
    }

    return makeSuccess(dynamicName.value.plainName);
  });

  public readonly markNeedsRecomputeLocalMetadata = makeAsyncResultFunc(
    [import.meta.filename, 'markNeedsRecomputeLocalMetadata'],
    async (trace): PR<undefined> => {
      const updatedHash = await this.backing_.updateLocalMetadataAtPath(trace, this.path, {
        hash: undefined,
        numDescendants: 0,
        sizeBytes: 0
      });
      if (!updatedHash.ok) {
        return generalizeFailureResult(trace, updatedHash, ['not-found', 'wrong-type']);
      }

      this.needsRecomputeLocalMetadataCount_ += 1;

      const store = this.weakStore_.deref();
      const parentPath = this.path.parentPath;
      if (store !== undefined && parentPath !== undefined) {
        const marked = await markSyncableNeedsRecomputeLocalMetadataAtPath(trace, store, parentPath);
        /* node:coverage disable */
        if (!marked.ok) {
          return generalizeFailureResult(trace, marked, ['not-found', 'untrusted', 'wrong-type']);
        }
        /* node:coverage enable */
      }

      return makeSuccess(undefined);
    }
  );

  // Private Methods

  private readonly computeLocalItemMetadataAndUpdateBacking_ = makeAsyncResultFunc(
    [import.meta.filename, 'computeLocalItemMetadataAndUpdateBacking_'],
    async (trace): PR<LocalItemMetadata> => {
      DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'get-metadata', pathString: this.path.toString() });

      do {
        const needsRecomputeLocalMetadataCount = this.needsRecomputeLocalMetadataCount_;

        const localItemMetadata = await this.computeLocalItemMetadata_(trace);
        if (!localItemMetadata.ok) {
          return localItemMetadata;
        }

        if (this.needsRecomputeLocalMetadataCount_ === needsRecomputeLocalMetadataCount) {
          const updatedHash = await this.backing_.updateLocalMetadataAtPath(trace, this.path, localItemMetadata.value);
          if (!updatedHash.ok) {
            return generalizeFailureResult(trace, updatedHash, ['not-found', 'wrong-type']);
          }

          return makeSuccess(localItemMetadata.value);
        }
      } while (true);
    }
  );
}
