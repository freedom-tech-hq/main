import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult, InternalStateError, NotFoundError } from 'freedom-common-errors';
import { generateSha256HashFromBuffer } from 'freedom-crypto';
import { InMemoryCache } from 'freedom-in-memory-cache';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import type { SyncableStoreBacking } from 'freedom-syncable-store-backing-types';
import type { MutableSyncableFileAccessor, MutableSyncableStore } from 'freedom-syncable-store-types';

import { getSyncableAtPath } from '../../utils/get/getSyncableAtPath.ts';
import { markSyncableNeedsRecomputeHashAtPath } from '../../utils/markSyncableNeedsRecomputeHashAtPath.ts';
import { CACHE_DURATION_MSEC } from '../consts/timing.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';

export class DefaultMutableSyncableFileAccessor implements MutableSyncableFileAccessor {
  public readonly type = 'file';

  public readonly path: SyncablePath;

  protected readonly weakStore_: WeakRef<MutableSyncableStore>;
  private folderOperationsHandler_!: FolderOperationsHandler;

  protected readonly backing_: SyncableStoreBacking;

  private readonly decode_: PRFunc<Uint8Array, never, [encodedData: Uint8Array]>;

  constructor({
    store,
    backing,
    path,
    folderOperationsHandler,
    decode
  }: {
    store: MutableSyncableStore;
    backing: SyncableStoreBacking;
    path: SyncablePath;
    folderOperationsHandler: FolderOperationsHandler;
    decode: PRFunc<Uint8Array, never, [encodedData: Uint8Array]>;
  }) {
    this.weakStore_ = new WeakRef(store);
    this.backing_ = backing;
    this.path = path;
    this.folderOperationsHandler_ = folderOperationsHandler;

    this.decode_ = decode;
  }

  // FileAccessor Methods

  public readonly isDeleted = makeAsyncResultFunc(
    [import.meta.filename, 'isDeleted'],
    async (trace, { recursive }: { recursive: boolean }): PR<boolean> => {
      const isDeleted = await this.folderOperationsHandler_.isPathMarkedAsDeleted(trace, this.path);
      if (!isDeleted.ok) {
        return isDeleted;
      } else if (isDeleted.value) {
        return makeSuccess(true);
      }

      if (recursive) {
        const store = this.weakStore_.deref();
        if (store === undefined) {
          return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
        }

        if (this.path.parentPath !== undefined) {
          const parent = await getSyncableAtPath(trace, store, this.path.parentPath);
          if (!parent.ok) {
            return generalizeFailureResult(trace, parent, ['not-found', 'untrusted', 'wrong-type']);
          }

          return await parent.value.isDeleted(trace, { recursive: true });
        }
      }

      return makeSuccess(false);
    }
  );

  public readonly getHash = makeAsyncResultFunc([import.meta.filename, 'getHash'], async (trace): PR<Sha256Hash> => {
    DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'get-metadata', pathString: this.path.toString() });

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
          return generalizeFailureResult(trace, marked, ['not-found', 'untrusted', 'wrong-type']);
        }
        /* node:coverage enable */
      }

      return makeSuccess(undefined);
    }
  );

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

  public readonly getBinary = makeAsyncResultFunc(
    [import.meta.filename, 'getBinary'],
    async (trace, { checkForDeletion }: { checkForDeletion: boolean }): PR<Uint8Array, 'deleted'> => {
      const cached = this.cache_.get(this, 'binary');
      if (cached !== undefined) {
        return makeSuccess(cached);
      }

      if (checkForDeletion) {
        const isDeleted = await this.isDeleted(trace, { recursive: true });
        if (!isDeleted.ok) {
          return isDeleted;
        } else if (isDeleted.value) {
          return makeFailure(new NotFoundError(trace, { message: `${this.path.toString()} was deleted`, errorCode: 'deleted' }));
        }
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
    }
  );

  public readonly getMetadata = makeAsyncResultFunc([import.meta.filename, 'getMetadata'], async (trace): PR<SyncableItemMetadata> => {
    DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'get-metadata', pathString: this.path.toString() });

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

const globalCache = new InMemoryCache<string, DefaultMutableSyncableFileAccessor, MutableSyncableStore>({
  cacheDurationMSec: CACHE_DURATION_MSEC,
  shouldResetIntervalOnGet: true
});

export const getOrCreateDefaultMutableSyncableFileAccessor = ({
  store,
  backing,
  path,
  folderOperationsHandler,
  decode
}: {
  store: MutableSyncableStore;
  backing: SyncableStoreBacking;
  path: SyncablePath;
  folderOperationsHandler: FolderOperationsHandler;
  decode: PRFunc<Uint8Array, never, [encodedData: Uint8Array]>;
}) =>
  globalCache.getOrCreate(
    store,
    path.toString(),
    () => new DefaultMutableSyncableFileAccessor({ store, backing, path, folderOperationsHandler, decode })
  );
