import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { LocalItemMetadata, SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import { isCompleteLocalItemMetadata, mergeLocalItemMetadata } from 'freedom-sync-types';
import type { SyncableStoreBacking } from 'freedom-syncable-store-backing-types';
import type { MutableSyncableItemAccessorBase, MutableSyncableStore } from 'freedom-syncable-store-types';

import { markSyncableNeedsRecomputeLocalMetadataAtPath } from '../utils/markSyncableNeedsRecomputeLocalMetadataAtPath.ts';

export interface DefaultMutableSyncableItemAccessorBaseConstructorArgs {
  backing: SyncableStoreBacking;
  path: SyncablePath;
}

export abstract class DefaultMutableSyncableItemAccessorBase implements MutableSyncableItemAccessorBase {
  public readonly path: SyncablePath;

  protected readonly backing_: SyncableStoreBacking;
  protected weakStore_!: WeakRef<MutableSyncableStore>;

  private needsRecomputeLocalMetadataCount_ = 0;

  constructor({ backing, path }: DefaultMutableSyncableItemAccessorBaseConstructorArgs) {
    this.backing_ = backing;
    this.path = path;
  }

  protected deferredInit_({ store }: { store: MutableSyncableStore }) {
    this.weakStore_ = new WeakRef(store);
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

  public readonly markNeedsRecomputeLocalMetadata = makeAsyncResultFunc(
    [import.meta.filename, 'markNeedsRecomputeLocalMetadata'],
    async (trace): PR<undefined> => {
      const updatedHash = await this.backing_.updateLocalMetadataAtPath(trace, this.path, { hash: undefined });
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
