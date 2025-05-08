import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { generateSha256HashFromBuffer } from 'freedom-crypto';
import { InMemoryCache } from 'freedom-in-memory-cache';
import { type LocalItemMetadata, type SyncablePath } from 'freedom-sync-types';
import type { SyncableStoreBacking } from 'freedom-syncable-store-backing-types';
import type { MutableSyncableFileAccessor, MutableSyncableStore } from 'freedom-syncable-store-types';

import { CACHE_DURATION_MSEC } from '../consts/timing.ts';
import type { DefaultMutableSyncableItemAccessorBaseConstructorArgs } from './DefaultMutableSyncableItemAccessorBase.ts';
import { DefaultMutableSyncableItemAccessorBase } from './DefaultMutableSyncableItemAccessorBase.ts';

export interface DefaultMutableSyncableFileAccessorConstructorArgs extends DefaultMutableSyncableItemAccessorBaseConstructorArgs {
  store: MutableSyncableStore;
  decode: PRFunc<Uint8Array, never, [encodedData: Uint8Array]>;
}

export class DefaultMutableSyncableFileAccessor extends DefaultMutableSyncableItemAccessorBase implements MutableSyncableFileAccessor {
  public readonly type = 'file';

  private readonly decode_: PRFunc<Uint8Array, never, [encodedData: Uint8Array]>;

  constructor({ store, decode, ...args }: DefaultMutableSyncableFileAccessorConstructorArgs) {
    super(args);

    super.deferredInit_({ store });

    this.decode_ = decode;
  }

  // Public Methods

  public toString() {
    return `File(${this.path.toString()})`;
  }

  // FileAccessor Methods

  public readonly getEncodedBinary = makeAsyncResultFunc([import.meta.filename, 'getEncodedBinary'], async (trace): PR<Uint8Array> => {
    DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'get-data', pathString: this.path.toString() });

    const found = await this.backing_.getAtPath(trace, this.path, 'file');
    if (!found.ok) {
      return generalizeFailureResult(trace, found, ['not-found', 'wrong-type']);
    }

    return await found.value.getBinary(trace);
  });

  private readonly cache_ = new InMemoryCache<'binary', Uint8Array>({
    cacheDurationMSec: CACHE_DURATION_MSEC,
    shouldResetIntervalOnGet: true
  });

  public readonly getBinary = makeAsyncResultFunc([import.meta.filename, 'getBinary'], async (trace): PR<Uint8Array> => {
    const cached = this.cache_.get(this, 'binary');
    if (cached !== undefined) {
      return makeSuccess(cached);
    }

    const encodedBinary = await this.getEncodedBinary(trace);
    if (!encodedBinary.ok) {
      return encodedBinary;
    }

    const decoded = await this.decode_(trace, encodedBinary.value);
    /* node:coverage disable */
    if (!decoded.ok) {
      return decoded;
    }
    /* node:coverage enable */

    return makeSuccess(this.cache_.set(this, 'binary', decoded.value));
  });

  // DefaultMutableSyncableItemAccessorBase Abstract Methods Overrides

  protected override readonly computeLocalItemMetadata_ = makeAsyncResultFunc(
    [import.meta.filename, 'computeLocalItemMetadata_'],
    async (trace: Trace): PR<LocalItemMetadata> => {
      const encodedBinary = await this.getEncodedBinary(trace);
      if (!encodedBinary.ok) {
        return encodedBinary;
      }

      const hash = await generateSha256HashFromBuffer(trace, encodedBinary.value);
      if (!hash.ok) {
        return hash;
      }

      const localItemMetadata: LocalItemMetadata = { hash: hash.value, numDescendants: 0, sizeBytes: encodedBinary.value.byteLength };

      return makeSuccess(localItemMetadata);
    }
  );
}

const globalCache = new InMemoryCache<string, DefaultMutableSyncableFileAccessor, MutableSyncableStore>({
  cacheDurationMSec: CACHE_DURATION_MSEC,
  shouldResetIntervalOnGet: true
});

export const getOrCreateDefaultMutableSyncableFileAccessor = ({
  store,
  backing,
  path,
  decode
}: {
  store: MutableSyncableStore;
  backing: SyncableStoreBacking;
  path: SyncablePath;
  decode: PRFunc<Uint8Array, never, [encodedData: Uint8Array]>;
}) => globalCache.getOrCreate(store, path.toString(), () => new DefaultMutableSyncableFileAccessor({ store, backing, path, decode }));
