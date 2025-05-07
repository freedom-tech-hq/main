import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import type { Trace } from 'freedom-contexts';
import { generateSha256HashFromHashesById } from 'freedom-crypto';
import { InMemoryCache } from 'freedom-in-memory-cache';
import { type LocalItemMetadata, type SyncableId, type SyncablePath } from 'freedom-sync-types';
import type { SyncableStoreBacking } from 'freedom-syncable-store-backing-types';
import type { MutableFileStore, MutableSyncableBundleAccessor, MutableSyncableStore, SyncTracker } from 'freedom-syncable-store-types';

import { CACHE_DURATION_MSEC } from '../consts/timing.ts';
import type { DefaultFileStoreConstructorArgs } from './DefaultFileStore.ts';
import { DefaultFileStore } from './DefaultFileStore.ts';
import type { DefaultMutableSyncableItemAccessorBaseConstructorArgs } from './DefaultMutableSyncableItemAccessorBase.ts';
import { DefaultMutableSyncableItemAccessorBase } from './DefaultMutableSyncableItemAccessorBase.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';

export interface DefaultMutableSyncableBundleAccessorConstructorArgs extends DefaultMutableSyncableItemAccessorBaseConstructorArgs {
  store: MutableSyncableStore;
  syncTracker: SyncTracker;
  folderOperationsHandler: FolderOperationsHandler;
}

export class DefaultMutableSyncableBundleAccessor extends DefaultMutableSyncableItemAccessorBase implements MutableSyncableBundleAccessor {
  public readonly type = 'bundle';

  protected readonly syncTracker_: SyncTracker;
  protected readonly folderOperationsHandler_: FolderOperationsHandler;

  private fileStore__: DefaultFileStore | undefined;
  private get fileStore_(): DefaultFileStore {
    if (this.fileStore__ === undefined) {
      const store = this.weakStore_.deref();
      if (store === undefined) {
        throw new Error('store was released');
      }

      this.fileStore__ = new DefaultFileStore({
        store,
        backing: this.backing_,
        syncTracker: this.syncTracker_,
        path: this.path,
        folderOperationsHandler: this.folderOperationsHandler_
      });
    }

    return this.fileStore__;
  }

  constructor({ store, syncTracker, folderOperationsHandler, ...args }: DefaultFileStoreConstructorArgs) {
    super(args);

    this.deferredInit_({ store });

    this.syncTracker_ = syncTracker;
    this.folderOperationsHandler_ = folderOperationsHandler;
  }

  // MutableFileStore Methods

  public readonly createBinaryFile: MutableFileStore['createBinaryFile'] = (...args) => this.fileStore_.createBinaryFile(...args);
  public readonly createBundle: MutableFileStore['createBundle'] = (...args) => this.fileStore_.createBundle(...args);
  public readonly delete: MutableFileStore['delete'] = (...args) => this.fileStore_.delete(...args);
  public readonly exists: MutableFileStore['exists'] = (...args) => this.fileStore_.exists(...args);
  public readonly generateNewSyncableItemName: MutableFileStore['generateNewSyncableItemName'] = (...args) =>
    this.fileStore_.generateNewSyncableItemName(...args);
  public readonly get: MutableFileStore['get'] = (...args) => this.fileStore_.get(...args);
  public readonly getIds: MutableFileStore['getIds'] = (...args) => this.fileStore_.getIds(...args);
  public readonly getMetadataById: MutableFileStore['getMetadataById'] = (...args) => this.fileStore_.getMetadataById(...args);
  public readonly getMutable: MutableFileStore['getMutable'] = (...args) => this.fileStore_.getMutable(...args);
  public readonly isDeleted: MutableFileStore['isDeleted'] = (...args) => this.fileStore_.isDeleted(...args);
  public readonly ls: MutableFileStore['ls'] = (...args) => this.fileStore_.ls(...args);

  // DefaultMutableSyncableItemAccessorBase Abstract Methods Overrides

  protected override readonly computeLocalItemMetadata_ = makeAsyncResultFunc(
    [import.meta.filename, 'computeLocalItemMetadata_'],
    async (trace: Trace): PR<LocalItemMetadata> => {
      const metadataById = await this.getMetadataById(trace);
      /* node:coverage disable */
      if (!metadataById.ok) {
        return metadataById;
      }
      /* node:coverage enable */

      let sizeBytes = 0;
      let numDescendants = 0;
      const hashesById = objectEntries(metadataById.value).reduce(
        (out, [id, metadata]) => {
          if (metadata === undefined) {
            return out;
          }

          out[id] = metadata.hash;
          sizeBytes += metadata.sizeBytes;
          numDescendants += 1 + metadata.numDescendants;

          return out;
        },
        {} as Partial<Record<SyncableId, Sha256Hash>>
      );

      const hash = await generateSha256HashFromHashesById(trace, hashesById);
      /* node:coverage disable */
      if (!hash.ok) {
        return hash;
      }
      /* node:coverage enable */

      const localItemMetadata: LocalItemMetadata = { hash: hash.value, numDescendants, sizeBytes };

      return makeSuccess(localItemMetadata);
    }
  );
}

const globalCache = new InMemoryCache<string, DefaultMutableSyncableBundleAccessor, MutableSyncableStore>({
  cacheDurationMSec: CACHE_DURATION_MSEC,
  shouldResetIntervalOnGet: true
});

export const getOrCreateDefaultMutableSyncableBundleAccessor = ({
  store,
  backing,
  syncTracker,
  path,
  folderOperationsHandler
}: {
  store: MutableSyncableStore;
  backing: SyncableStoreBacking;
  syncTracker: SyncTracker;
  path: SyncablePath;
  folderOperationsHandler: FolderOperationsHandler;
}) =>
  globalCache.getOrCreate(
    store,
    path.toString(),
    () => new DefaultMutableSyncableBundleAccessor({ store, backing, syncTracker, path, folderOperationsHandler })
  );
