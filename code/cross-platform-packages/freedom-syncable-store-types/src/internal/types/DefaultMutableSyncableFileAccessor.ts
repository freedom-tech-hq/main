import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { generateSha256HashFromBuffer } from 'freedom-crypto';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';

import type { SyncableStoreBacking } from '../../types/backing/SyncableStoreBacking.ts';
import type { MutableSyncableFileAccessor } from '../../types/MutableSyncableFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { markSyncableNeedsRecomputeHashAtPath } from '../../utils/markSyncableNeedsRecomputeHashAtPath.ts';

export class DefaultMutableSyncableFileAccessor implements MutableSyncableFileAccessor {
  public readonly type = 'file';

  public readonly path: SyncablePath;

  protected readonly weakStore_: WeakRef<MutableSyncableStore>;
  protected readonly backing_: SyncableStoreBacking;

  private readonly decode_: PRFunc<Uint8Array, never, [encodedData: Uint8Array]>;

  constructor({
    store,
    backing,
    path,
    decode
  }: {
    store: WeakRef<MutableSyncableStore>;
    backing: SyncableStoreBacking;
    path: SyncablePath;
    decode: PRFunc<Uint8Array, never, [encodedData: Uint8Array]>;
  }) {
    this.weakStore_ = store;
    this.backing_ = backing;
    this.path = path;

    this.decode_ = decode;
  }

  // FileAccessor Methods

  public readonly getHash = makeAsyncResultFunc([import.meta.filename, 'getHash'], async (trace): PR<Sha256Hash> => {
    const metadata = await this.backing_.getMetadataAtPath(trace, this.path);
    if (!metadata.ok) {
      return generalizeFailureResult(trace, metadata, ['not-found', 'wrong-type']);
    }

    if (metadata.value.hash !== undefined) {
      return makeSuccess(metadata.value.hash);
    }

    const encodedBinary = await this.getEncodedBinary(trace);
    if (!encodedBinary.ok) {
      return encodedBinary;
    }

    const hash = await generateSha256HashFromBuffer(trace, encodedBinary.value);
    if (!hash.ok) {
      return hash;
    }

    const updatedMetadata = await this.backing_.updateLocalMetadataAtPath(trace, this.path, { hash: hash.value });
    if (!updatedMetadata.ok) {
      return generalizeFailureResult(trace, updatedMetadata, ['not-found', 'wrong-type']);
    }

    return makeSuccess(hash.value);
  });

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

  public readonly getEncodedBinary = makeAsyncResultFunc([import.meta.filename, 'getEncodedBinary'], async (trace): PR<Uint8Array> => {
    const found = await this.backing_.getAtPath(trace, this.path, 'file');
    if (!found.ok) {
      return generalizeFailureResult(trace, found, ['not-found', 'wrong-type']);
    }

    return await found.value.getBinary(trace);
  });

  public readonly getBinary = makeAsyncResultFunc([import.meta.filename, 'getBinary'], async (trace): PR<Uint8Array> => {
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

    return makeSuccess(decoded.value);
  });

  public readonly getMetadata = makeAsyncResultFunc([import.meta.filename, 'getMetadata'], async (trace): PR<SyncableItemMetadata> => {
    const metadata = await this.backing_.getMetadataAtPath(trace, this.path);
    if (!metadata.ok) {
      return generalizeFailureResult(trace, metadata, ['not-found', 'wrong-type']);
    }

    return makeSuccess(metadata.value);
  });

  public toString() {
    return `File(${this.path.toString()})`;
  }
}
