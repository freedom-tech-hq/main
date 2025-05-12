import type { PR, PRFunc } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ConflictError, generalizeFailureResult, InternalStateError, NotFoundError } from 'freedom-common-errors';
import { type Trace } from 'freedom-contexts';
import { generateSha256HashForEmptyString, generateSha256HashFromBuffer, generateSha256HashFromHashesById } from 'freedom-crypto';
import type { SyncableId, SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import { isSyncableItemEncrypted, uuidId } from 'freedom-sync-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';
import type {
  MutableFileStore,
  MutableSyncableBundleAccessor,
  MutableSyncableFileAccessor,
  MutableSyncableFolderAccessor
} from 'freedom-syncable-store-types';

import { generateProvenanceForFileAtPath } from '../../utils/generateProvenanceForFileAtPath.ts';
import { generateProvenanceForFolderLikeItemAtPath } from '../../utils/generateProvenanceForFolderLikeItemAtPath.ts';
import { isSyncableDeleted } from '../../utils/isSyncableDeleted.ts';
import { getOrCreateDefaultMutableSyncableBundleAccessor } from './DefaultMutableSyncableBundleAccessor.ts';
import { getOrCreateDefaultMutableSyncableFileAccessor } from './DefaultMutableSyncableFileAccessor.ts';
import type { DefaultStoreBaseConstructorArgs } from './DefaultStoreBase.ts';
import { DefaultStoreBase } from './DefaultStoreBase.ts';

export type DefaultFileStoreConstructorArgs = Omit<DefaultStoreBaseConstructorArgs, 'supportedItemTypes'>;

export class DefaultFileStore extends DefaultStoreBase implements MutableFileStore {
  private isEncryptedByDefault_: boolean;

  constructor(args: DefaultFileStoreConstructorArgs) {
    super({ ...args, supportedItemTypes: ['file', 'bundle'] });

    const path = args.path;
    this.isEncryptedByDefault_ = path.lastId === undefined || isSyncableItemEncrypted(path.lastId);
  }

  // Public Methods

  public toString() {
    return `DefaultFileStore(${this.path_.toString()})`;
  }

  // Abstract MutableFileStore Method Overrides

  protected makeFolderAccessor_(_args: { path: SyncablePath }): MutableSyncableFolderAccessor {
    throw new Error("makeFolderAccessor_ isn't supported by DefaultFileStore");
  }

  protected makeBundleAccessor_({ path }: { path: SyncablePath }): MutableSyncableBundleAccessor {
    const store = this.weakStore_.deref();
    if (store === undefined) {
      throw new Error('store was released');
    }

    return getOrCreateDefaultMutableSyncableBundleAccessor({
      store,
      backing: this.backing_,
      syncTracker: this.syncTracker_,
      path,
      folderOperationsHandler: this.folderOperationsHandler_
    });
  }

  protected makeFileAccessor_({ path }: { path: SyncablePath }): MutableSyncableFileAccessor {
    const store = this.weakStore_.deref();
    if (store === undefined) {
      throw new Error('store was released');
    }

    const decode: PRFunc<Uint8Array, never, [encodedData: Uint8Array]> = isSyncableItemEncrypted(path.lastId!)
      ? this.verifyAndDecryptBuffer_
      : passThroughData;
    return getOrCreateDefaultMutableSyncableFileAccessor({
      store,
      backing: this.backing_,
      path,
      folderOperationsHandler: this.folderOperationsHandler_,
      decode
    });
  }

  // MutableFileStore Methods

  public readonly createBinaryFile: MutableFileStore['createBinaryFile'] = makeAsyncResultFunc(
    [import.meta.filename, 'createBinaryFile'],
    async (trace: Trace, args): PR<MutableSyncableFileAccessor, 'conflict' | 'deleted'> => {
      switch (args.mode) {
        case 'via-sync':
          return await this.createPreEncodedBinaryFile_(trace, args.id, args.encodedValue, args.metadata);
        case undefined:
        case 'local': {
          const store = this.weakStore_.deref();
          if (store === undefined) {
            return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
          }

          const id = args.id ?? uuidId({ type: 'file', encrypted: this.isEncryptedByDefault_ });
          const newPath = this.path_.append(id);

          const encode = isSyncableItemEncrypted(id) ? this.encryptAndSignBuffer_ : passThroughData;
          const encodedData = await encode(trace, args.value);
          /* node:coverage disable */
          if (!encodedData.ok) {
            return encodedData;
          }
          /* node:coverage enable */

          const getSha256ForItemProvenance = (trace: Trace) => generateSha256HashFromBuffer(trace, encodedData.value);

          const isDeleted = await isSyncableDeleted(trace, store, newPath, { recursive: false });
          if (!isDeleted.ok) {
            return isDeleted;
          } else if (isDeleted.value) {
            return makeFailure(new NotFoundError(trace, { message: `${newPath.toString()} was deleted`, errorCode: 'deleted' }));
          }

          const name = await this.folderOperationsHandler_.generateNewSyncableItemName(trace, {
            name: args.name ?? id,
            path: this.path_,
            getSha256ForItemProvenance
          });
          /* node:coverage disable */
          if (!name.ok) {
            return name;
          }
          /* node:coverage enable */

          const provenance = await generateProvenanceForFileAtPath(trace, store, {
            path: newPath,
            type: 'file',
            name: name.value,
            getSha256ForItemProvenance,
            trustedTimeSignature: args.trustedTimeSignature
          });
          if (!provenance.ok) {
            return provenance;
          }

          return await this.createPreEncodedBinaryFile_(trace, id, encodedData.value, { name: name.value, provenance: provenance.value });
        }
      }
    }
  );

  public readonly createBundle: MutableFileStore['createBundle'] = makeAsyncResultFunc(
    [import.meta.filename, 'createBundle'],
    async (trace, args): PR<MutableSyncableBundleAccessor, 'conflict' | 'deleted'> => {
      switch (args.mode) {
        case 'via-sync':
          return await this.createPreEncodedBundle_(trace, args.id, args.metadata);
        case undefined:
        case 'local': {
          const store = this.weakStore_.deref();
          if (store === undefined) {
            return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
          }

          const id = args.id ?? uuidId({ type: 'bundle', encrypted: this.isEncryptedByDefault_ });
          const newPath = this.path_.append(id);

          const isDeleted = await isSyncableDeleted(trace, store, newPath, { recursive: false });
          if (!isDeleted.ok) {
            return isDeleted;
          } else if (isDeleted.value) {
            return makeFailure(new NotFoundError(trace, { message: `${newPath.toString()} was deleted`, errorCode: 'deleted' }));
          }

          const name = await this.folderOperationsHandler_.generateNewSyncableItemName(trace, {
            name: args.name ?? id,
            path: newPath,
            getSha256ForItemProvenance: generateSha256HashForEmptyString
          });
          /* node:coverage disable */
          if (!name.ok) {
            return name;
          }
          /* node:coverage enable */

          const provenance = await generateProvenanceForFolderLikeItemAtPath(trace, store, {
            path: newPath,
            type: 'bundle',
            name: name.value,
            trustedTimeSignature: args.trustedTimeSignature
          });
          if (!provenance.ok) {
            return provenance;
          }

          return await this.createPreEncodedBundle_(trace, id, { name: name.value, provenance: provenance.value });
        }
      }
    }
  );

  // Private Encrypt / Decrypt Methods

  protected readonly encryptAndSignBuffer_ = makeAsyncResultFunc(
    [import.meta.filename, 'encryptAndSignBuffer_'],
    async (trace: Trace, rawData: Uint8Array): PR<Uint8Array> => {
      DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'encode-data', pathString: this.path_.toString() });

      return await this.folderOperationsHandler_.encryptAndSignBuffer(trace, rawData);
    }
  );

  private verifyAndDecryptBuffer_ = makeAsyncResultFunc(
    [import.meta.filename, 'verifyAndDecryptBuffer_'],
    (trace: Trace, encodedData: Uint8Array): PR<Uint8Array> => {
      DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'decode-data', pathString: this.path_.toString() });

      return this.folderOperationsHandler_.verifyAndDecryptBuffer(trace, encodedData);
    }
  );

  // Private Methods

  private readonly createPreEncodedBinaryFile_ = makeAsyncResultFunc(
    [import.meta.filename, 'createPreEncodedBinaryFile_'],
    async (
      trace: Trace,
      id: SyncableId,
      encodedData: Uint8Array,
      metadata: SyncableItemMetadata
    ): PR<MutableSyncableFileAccessor, 'conflict'> => {
      const newPath = this.path_.append(id);

      DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'create-binary', pathString: newPath.toString() });

      const exists = await this.backing_.existsAtPath(trace, newPath);
      if (!exists.ok) {
        return exists;
      } else if (exists.value) {
        return makeFailure(new ConflictError(trace, { message: `${newPath.toString()} already exists`, errorCode: 'conflict' }));
      }

      const hash = await generateSha256HashFromBuffer(trace, encodedData);
      /* node:coverage disable */
      if (!hash.ok) {
        return hash;
      }
      /* node:coverage enable */

      const backingMetadata: SyncableStoreBackingItemMetadata = {
        ...metadata,
        hash: hash.value,
        numDescendants: 0,
        sizeBytes: encodedData.byteLength
      };

      const createdFile = await this.backing_.createBinaryFileWithPath(trace, newPath, {
        data: encodedData,
        metadata: backingMetadata
      });
      if (!createdFile.ok) {
        return generalizeFailureResult(trace, createdFile, ['not-found', 'wrong-type']);
      }

      const itemAccessor = this.makeItemAccessor_(newPath, 'file');

      const marked = await itemAccessor.markNeedsRecomputeLocalMetadata(trace);
      /* node:coverage disable */
      if (!marked.ok) {
        return marked;
      }
      /* node:coverage enable */

      DEV: debugTopic('SYNC', (log) => log(trace, `Notifying itemAdded for file ${newPath.toShortString()}`));
      this.syncTracker_.notify('itemAdded', { path: newPath, hash: hash.value });

      return makeSuccess(itemAccessor);
    }
  );

  public readonly createPreEncodedBundle_ = makeAsyncResultFunc(
    [import.meta.filename, 'createPreEncodedBundle_'],
    async (trace, id: SyncableId, metadata: SyncableItemMetadata): PR<MutableSyncableBundleAccessor, 'conflict'> => {
      const newPath = this.path_.append(id);

      DEV: this.weakStore_.deref()?.devLogging.appendLogEntry?.({ type: 'create-bundle', pathString: newPath.toString() });

      const exists = await this.backing_.existsAtPath(trace, newPath);
      if (!exists.ok) {
        return exists;
      } else if (exists.value) {
        return makeFailure(new ConflictError(trace, { message: `${newPath.toString()} already exists`, errorCode: 'conflict' }));
      }

      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      const hash = await generateSha256HashFromHashesById(trace, {});
      /* node:coverage disable */
      if (!hash.ok) {
        return hash;
      }
      /* node:coverage enable */

      const backingMetadata: SyncableStoreBackingItemMetadata = { ...metadata, hash: hash.value, numDescendants: 0, sizeBytes: 0 };

      const createdBundle = await this.backing_.createFolderWithPath(trace, newPath, { metadata: backingMetadata });
      if (!createdBundle.ok) {
        return generalizeFailureResult(trace, createdBundle, ['not-found', 'wrong-type']);
      }

      const itemAccessor = this.makeMutableItemAccessor_(newPath, 'bundle');

      const marked = await itemAccessor.markNeedsRecomputeLocalMetadata(trace);
      /* node:coverage disable */
      if (!marked.ok) {
        return marked;
      }
      /* node:coverage enable */

      DEV: debugTopic('SYNC', (log) => log(trace, `Notifying itemAdded for bundle ${newPath.toShortString()}`));
      this.syncTracker_.notify('itemAdded', { path: newPath, hash: hash.value });

      return makeSuccess(itemAccessor);
    }
  );
}

// Helpers

const passThroughData = (_trace: Trace, data: Uint8Array): PR<Uint8Array> => Promise.resolve(makeSuccess(data));
