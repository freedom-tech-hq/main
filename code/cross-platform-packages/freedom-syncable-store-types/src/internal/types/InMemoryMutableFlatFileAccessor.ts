import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { StaticSyncablePath, SyncableProvenance } from 'freedom-sync-types';

import type { FlatFileAccessor } from '../../types/FlatFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { markSyncableNeedsRecomputeHashAtPath } from '../../utils/markSyncableNeedsRecomputeHashAtPath.ts';
import { InMemoryMutableFileAccessorBase } from './InMemoryMutableFileAccessorBase.ts';

export class InMemoryMutableFlatFileAccessor extends InMemoryMutableFileAccessorBase implements FlatFileAccessor {
  public readonly type = 'flatFile';

  private readonly data_: Uint8Array;
  private readonly hash_: Sha256Hash;
  private readonly provenance_: SyncableProvenance;
  private readonly decode_: PRFunc<Uint8Array, never, [encodedData: Uint8Array]>;

  constructor({
    store,
    path,
    data,
    hash,
    provenance,
    decode
  }: {
    store: WeakRef<MutableSyncableStore>;
    path: StaticSyncablePath;
    data: Uint8Array;
    hash: Sha256Hash;
    provenance: SyncableProvenance;
    decode: PRFunc<Uint8Array, never, [encodedData: Uint8Array]>;
  }) {
    super({ store, path });

    this.data_ = data;
    this.hash_ = hash;
    this.provenance_ = provenance;
    this.decode_ = decode;
  }

  // FlatFileAccessor Methods

  public readonly getHash = makeAsyncResultFunc(
    [import.meta.filename, 'getHash'],
    async (_trace, _options?: { recompute?: boolean }): PR<Sha256Hash> => {
      return makeSuccess(this.hash_);
    }
  );

  public readonly markNeedsRecomputeHash = makeAsyncResultFunc(
    [import.meta.filename, 'markNeedsRecomputeHash'],
    async (trace): PR<undefined> => {
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

  public readonly getEncodedBinary = makeAsyncResultFunc(
    [import.meta.filename, 'getEncodedBinary'],
    async (_trace): PR<Uint8Array> => makeSuccess(this.data_)
  );

  public readonly getBinary = makeAsyncResultFunc([import.meta.filename, 'getBinary'], async (trace): PR<Uint8Array> => {
    const decoded = await this.decode_(trace, this.data_);
    /* node:coverage disable */
    if (!decoded.ok) {
      return decoded;
    }
    /* node:coverage enable */

    return makeSuccess(decoded.value);
  });

  public readonly getProvenance = makeAsyncResultFunc(
    [import.meta.filename, 'getProvenance'],
    async (_trace): PR<SyncableProvenance> => makeSuccess(this.provenance_)
  );
}
