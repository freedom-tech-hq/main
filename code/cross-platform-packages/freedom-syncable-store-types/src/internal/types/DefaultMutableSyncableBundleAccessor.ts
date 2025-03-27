import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { StaticSyncablePath } from 'freedom-sync-types';

import type { MutableSyncableBundleAccessor } from '../../types/MutableSyncableBundleAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { markSyncableNeedsRecomputeHashAtPath } from '../../utils/markSyncableNeedsRecomputeHashAtPath.ts';
import type { DefaultFileStoreBase } from './DefaultFileStoreBase.ts';

export class DefaultMutableSyncableBundleAccessor implements MutableSyncableBundleAccessor {
  public readonly type = 'bundle';
  public readonly path: StaticSyncablePath;

  private readonly weakStore_: WeakRef<MutableSyncableStore>;
  private readonly data_: DefaultFileStoreBase;

  constructor({ store, path, data }: { store: WeakRef<MutableSyncableStore>; path: StaticSyncablePath; data: DefaultFileStoreBase }) {
    this.weakStore_ = store;
    this.path = path;
    this.data_ = data;

    this.createBinaryFile = data.createBinaryFile;
    this.createBundle = data.createBundle;
    this.delete = data.delete;
    this.dynamicToStaticId = data.dynamicToStaticId;
    this.exists = data.exists;
    this.generateNewSyncableItemId = data.generateNewSyncableItemId;
    this.get = data.get;
    this.getHash = data.getHash;
    this.getHashesById = data.getHashesById;
    this.getIds = data.getIds;
    this.getMetadata = data.getMetadata;
    this.getMutable = data.getMutable;
    this.ls = data.ls;
    this.staticToDynamicId = data.staticToDynamicId;
  }

  // MutableBundleAccessor Methods Pointing to this.data_

  public readonly createBinaryFile: MutableSyncableBundleAccessor['createBinaryFile'];
  public readonly createBundle: MutableSyncableBundleAccessor['createBundle'];
  public readonly dynamicToStaticId: MutableSyncableBundleAccessor['dynamicToStaticId'];
  public readonly delete: MutableSyncableBundleAccessor['delete'];
  public readonly exists: MutableSyncableBundleAccessor['exists'];
  public readonly generateNewSyncableItemId: MutableSyncableBundleAccessor['generateNewSyncableItemId'];
  public readonly get: MutableSyncableBundleAccessor['get'];
  public readonly getHash: MutableSyncableBundleAccessor['getHash'];
  public readonly getHashesById: MutableSyncableBundleAccessor['getHashesById'];
  public readonly getIds: MutableSyncableBundleAccessor['getIds'];
  public readonly getMetadata: MutableSyncableBundleAccessor['getMetadata'];
  public readonly getMutable: MutableSyncableBundleAccessor['getMutable'];
  public readonly ls: MutableSyncableBundleAccessor['ls'];
  public readonly staticToDynamicId: MutableSyncableBundleAccessor['staticToDynamicId'];

  // MutableBundleAccessor Methods

  public readonly markNeedsRecomputeHash = makeAsyncResultFunc(
    [import.meta.filename, 'markNeedsRecomputeHash'],
    async (trace): PR<undefined> => {
      const marked = await this.data_.markNeedsRecomputeHash(trace);
      if (!marked.ok) {
        return marked;
      }

      const store = this.weakStore_.deref();
      const parentPath = this.path.parentPath;
      if (store !== undefined && parentPath !== undefined) {
        const marked = await markSyncableNeedsRecomputeHashAtPath(trace, store, parentPath);
        /* node:coverage disable */
        if (!marked.ok) {
          return generalizeFailureResult(trace, marked, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
        }
        /* node:coverage enable */
      }

      return makeSuccess(undefined);
    }
  );

  // Public Methods

  public readonly sweep = (trace: Trace) => this.data_.sweep(trace);
}
