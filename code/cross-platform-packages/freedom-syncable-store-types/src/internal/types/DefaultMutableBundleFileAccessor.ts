import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { StaticSyncablePath } from 'freedom-sync-types';

import type { MutableBundleFileAccessor } from '../../types/MutableBundleFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { markSyncableNeedsRecomputeHashAtPath } from '../../utils/markSyncableNeedsRecomputeHashAtPath.ts';
import type { DefaultBundleBase } from './DefaultBundleBase.ts';
import { DefaultMutableFileAccessorBase } from './DefaultMutableFileAccessorBase.ts';

export class DefaultMutableBundleFileAccessor extends DefaultMutableFileAccessorBase implements MutableBundleFileAccessor {
  public readonly type = 'bundleFile';

  private readonly data_: DefaultBundleBase;

  constructor({ store, path, data }: { store: WeakRef<MutableSyncableStore>; path: StaticSyncablePath; data: DefaultBundleBase }) {
    super({ store, path });

    this.data_ = data;

    this.createBinaryFile = data.createBinaryFile;
    this.createBundleFile = data.createBundleFile;
    this.delete = data.delete;
    this.dynamicToStaticId = data.dynamicToStaticId;
    this.exists = data.exists;
    this.generateNewSyncableItemId = data.generateNewSyncableItemId;
    this.get = data.get;
    this.getHash = data.getHash;
    this.getHashesById = data.getHashesById;
    this.getIds = data.getIds;
    this.getMutable = data.getMutable;
    this.getProvenance = data.getProvenance;
    this.ls = data.ls;
    this.staticToDynamicId = data.staticToDynamicId;
  }

  // MutableBundleFileAccessor Methods Pointing to this.data_

  public readonly createBinaryFile: MutableBundleFileAccessor['createBinaryFile'];
  public readonly createBundleFile: MutableBundleFileAccessor['createBundleFile'];
  public readonly dynamicToStaticId: MutableBundleFileAccessor['dynamicToStaticId'];
  public readonly delete: MutableBundleFileAccessor['delete'];
  public readonly exists: MutableBundleFileAccessor['exists'];
  public readonly generateNewSyncableItemId: MutableBundleFileAccessor['generateNewSyncableItemId'];
  public readonly get: MutableBundleFileAccessor['get'];
  public readonly getHash: MutableBundleFileAccessor['getHash'];
  public readonly getHashesById: MutableBundleFileAccessor['getHashesById'];
  public readonly getIds: MutableBundleFileAccessor['getIds'];
  public readonly getMutable: MutableBundleFileAccessor['getMutable'];
  public readonly getProvenance: MutableBundleFileAccessor['getProvenance'];
  public readonly ls: MutableBundleFileAccessor['ls'];
  public readonly staticToDynamicId: MutableBundleFileAccessor['staticToDynamicId'];

  // MutableBundleFileAccessor Methods

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
