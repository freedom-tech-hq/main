import type { PR } from 'freedom-async';
import {
  allResults,
  allResultsMapped,
  allResultsReduced,
  debugTopic,
  excludeFailureResult,
  makeAsyncResultFunc,
  makeFailure,
  makeSuccess
} from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectEntries, objectKeys } from 'freedom-cast';
import { ConflictError, generalizeFailureResult, InternalStateError, NotFoundError } from 'freedom-common-errors';
import { type Trace } from 'freedom-contexts';
import { generateSha256HashForEmptyString, generateSha256HashFromBuffer, generateSha256HashFromHashesById } from 'freedom-crypto';
import type { SyncableId, SyncableItemMetadata, SyncableItemType, SyncablePath } from 'freedom-sync-types';
import { extractSyncableItemTypeFromId, isSyncableItemEncrypted, syncableItemTypes, uuidId } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import { flatten } from 'lodash-es';
import type { SingleOrArray } from 'yaschema';

import type { SyncableStoreBacking } from '../../types/backing/SyncableStoreBacking.ts';
import type { BundleManagement } from '../../types/BundleManagement.ts';
import type { GenerateNewSyncableItemNameFunc } from '../../types/GenerateNewSyncableItemNameFunc.ts';
import type { LocalItemMetadata } from '../../types/LocalItemMetadata.ts';
import type { MutableFileStore } from '../../types/MutableFileStore.ts';
import type { MutableSyncableBundleAccessor } from '../../types/MutableSyncableBundleAccessor.ts';
import type { MutableSyncableFileAccessor } from '../../types/MutableSyncableFileAccessor.ts';
import type { MutableSyncableItemAccessor } from '../../types/MutableSyncableItemAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SyncableItemAccessor } from '../../types/SyncableItemAccessor.ts';
import type { SyncTracker } from '../../types/SyncTracker.ts';
import { generateProvenanceForFileAtPath } from '../../utils/generateProvenanceForFileAtPath.ts';
import { generateProvenanceForFolderLikeItemAtPath } from '../../utils/generateProvenanceForFolderLikeItemAtPath.ts';
import { guardIsExpectedType } from '../../utils/guards/guardIsExpectedType.ts';
import { guardIsSyncableItemTrusted } from '../../utils/guards/guardIsSyncableItemTrusted.ts';
import { markSyncableNeedsRecomputeHashAtPath } from '../../utils/markSyncableNeedsRecomputeHashAtPath.ts';
import { intersectSyncableItemTypes } from '../utils/intersectSyncableItemTypes.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';

export interface DefaultFileStoreBaseConstructorArgs {
  store: WeakRef<MutableSyncableStore>;
  backing: SyncableStoreBacking;
  syncTracker: SyncTracker;
  folderOperationsHandler: FolderOperationsHandler;
  path: SyncablePath;
  supportsDeletion: boolean;
}

export abstract class DefaultFileStoreBase implements MutableFileStore, BundleManagement {
  public readonly type = 'bundle';
  public readonly path: SyncablePath;
  public readonly supportsDeletion: boolean;

  protected readonly weakStore_: WeakRef<MutableSyncableStore>;
  protected readonly syncTracker_: SyncTracker;
  protected readonly folderOperationsHandler_: FolderOperationsHandler;

  protected readonly backing_: SyncableStoreBacking;

  private needsRecomputeHashCount_ = 0;

  constructor({ store, backing, syncTracker, folderOperationsHandler, path, supportsDeletion }: DefaultFileStoreBaseConstructorArgs) {
    this.supportsDeletion = supportsDeletion;
    this.weakStore_ = store;
    this.backing_ = backing;
    this.syncTracker_ = syncTracker;
    this.folderOperationsHandler_ = folderOperationsHandler;
    this.path = path;
  }

  // Abstract Methods

  protected abstract computeHash_(trace: Trace, encodedData: Uint8Array): PR<Sha256Hash>;
  protected abstract decodeData_(trace: Trace, encodedData: Uint8Array): PR<Uint8Array>;
  protected abstract encodeData_(trace: Trace, rawData: Uint8Array): PR<Uint8Array>;
  protected abstract makeBundleAccessor_(args: { path: SyncablePath }): MutableSyncableBundleAccessor;
  protected abstract makeFileAccessor_(args: { path: SyncablePath }): MutableSyncableFileAccessor;
  protected abstract isEncrypted_(): boolean;

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

          const encodedData = await this.encodeData_(trace, args.value);
          /* node:coverage disable */
          if (!encodedData.ok) {
            return encodedData;
          }
          /* node:coverage enable */

          const getSha256ForItemProvenance = (trace: Trace) => generateSha256HashFromBuffer(trace, encodedData.value);

          const id = args.id ?? uuidId('file');
          const newPath = this.path.append(id);

          const name = await this.folderOperationsHandler_.generateNewSyncableItemName(trace, {
            name: args.name ?? id,
            path: this.path,
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

          const id = args.id ?? uuidId('bundle');
          const newPath = this.path.append(id);

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

  public readonly delete = makeAsyncResultFunc(
    [import.meta.filename, 'delete'],
    async (trace, id: SyncableId): PR<undefined, 'not-found'> => {
      if (!this.supportsDeletion) {
        return makeFailure(new InternalStateError(trace, { message: `Deletion is not supported in ${this.path.toString()}` }));
      }

      const removePath = this.path.append(id);

      // Checking that the requested file exists in the backing
      const exists = await this.backing_.existsAtPath(trace, removePath);
      /* node:coverage disable */
      if (!exists.ok) {
        return exists;
      } else if (!exists.value) {
        return makeFailure(
          new NotFoundError(trace, {
            message: `No file found for ID: ${id} in ${this.path.toString()}`,
            errorCode: 'not-found'
          })
        );
      }
      /* node:coverage enable */

      const isDeleted = await this.folderOperationsHandler_.isPathMarkedAsDeleted(trace, removePath);
      if (!isDeleted.ok) {
        return isDeleted;
      } else if (isDeleted.value) {
        // Already deleted
        return makeSuccess(undefined);
      }

      const markedAsDeleted = await this.folderOperationsHandler_.markPathAsDeleted(trace, removePath);
      /* node:coverage disable */
      if (!markedAsDeleted.ok) {
        return markedAsDeleted;
      }
      /* node:coverage enable */

      const markedNeedsRecomputedHash = await this.markNeedsRecomputeHash(trace);
      /* node:coverage disable */
      if (!markedNeedsRecomputedHash.ok) {
        return markedNeedsRecomputedHash;
      }
      /* node:coverage enable */

      return makeSuccess(undefined);
    }
  );

  public readonly exists = makeAsyncResultFunc([import.meta.filename, 'exists'], async (trace, id: SyncableId): PR<boolean> => {
    const checkingPath = this.path.append(id);

    // Checking that the requested file exists in the backing
    const exists = await this.backing_.existsAtPath(trace, checkingPath);
    /* node:coverage disable */
    if (!exists.ok) {
      return exists;
    } else if (!exists.value) {
      return makeSuccess(false);
    }
    /* node:coverage enable */

    const guards = await disableLam(trace, true, (trace) => this.guardNotDeleted_(trace, checkingPath, 'deleted'));
    if (!guards.ok) {
      if (guards.value.errorCode === 'deleted') {
        return makeSuccess(false);
      }
      return excludeFailureResult(guards, 'deleted');
    }

    return makeSuccess(true);
  });

  public readonly getMutable = makeAsyncResultFunc(
    [import.meta.filename, 'getMutable'],
    async <T extends SyncableItemType = SyncableItemType>(
      trace: Trace,
      id: SyncableId,
      expectedType?: SingleOrArray<T>
    ): PR<MutableSyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      const getPath = this.path.append(id);

      const itemType = extractSyncableItemTypeFromId(id);
      const guards = await allResults(trace, [
        this.guardNotDeleted_(trace, getPath, 'deleted'),
        guardIsExpectedType(
          trace,
          getPath,
          itemType,
          intersectSyncableItemTypes(expectedType, syncableItemTypes.exclude('folder')),
          'wrong-type'
        )
      ]);
      if (!guards.ok) {
        return guards;
      }

      // Checking existence after deletion check because we want to return a 'deleted' errorCode explicitly if deleted
      const exists = await this.exists(trace, id);
      if (!exists.ok) {
        return exists;
      } else if (!exists.value) {
        return makeFailure(new NotFoundError(trace, { message: `${getPath.toString()} not found`, errorCode: 'not-found' }));
      }

      const item = this.makeMutableItemAccessor_<T>(getPath, itemType as T);

      const trustGuard = await guardIsSyncableItemTrusted(trace, store, item);
      if (!trustGuard.ok) {
        return trustGuard;
      }

      return makeSuccess(item);
    }
  );

  public readonly generateNewSyncableItemName: GenerateNewSyncableItemNameFunc = (trace, args) =>
    this.folderOperationsHandler_.generateNewSyncableItemName(trace, args);

  // FileStore Methods

  public readonly getHash = makeAsyncResultFunc([import.meta.filename, 'getHash'], async (trace): PR<Sha256Hash> => {
    const metadata = await this.backing_.getMetadataAtPath(trace, this.path);
    if (!metadata.ok) {
      return generalizeFailureResult(trace, metadata, ['not-found', 'wrong-type']);
    }

    const hash = metadata.value.hash;
    if (hash !== undefined) {
      return makeSuccess(hash);
    }

    do {
      const needsRecomputeHashCount = this.needsRecomputeHashCount_;

      const metadataById = await this.getMetadataById(trace);
      /* node:coverage disable */
      if (!metadataById.ok) {
        return metadataById;
      }
      /* node:coverage enable */

      const hashesById = objectEntries(metadataById.value).reduce(
        (out, [id, metadata]) => {
          if (metadata === undefined) {
            return out;
          }

          out[id] = metadata.hash;

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

      if (this.needsRecomputeHashCount_ === needsRecomputeHashCount) {
        const updatedHash = await this.backing_.updateLocalMetadataAtPath(trace, this.path, { hash: hash.value });
        if (!updatedHash.ok) {
          return generalizeFailureResult(trace, updatedHash, ['not-found', 'wrong-type']);
        }

        return makeSuccess(hash.value);
      }
    } while (true);
  });

  public readonly getMetadataById = makeAsyncResultFunc(
    [import.meta.filename, 'getMetadataById'],
    async (trace: Trace): PR<Partial<Record<SyncableId, SyncableItemMetadata & LocalItemMetadata>>> => {
      // Deleted files are already filtered out using getIds
      const ids = await this.getIds(trace);
      /* node:coverage disable */
      if (!ids.ok) {
        return ids;
      }
      /* node:coverage enable */

      const metadataByIds = await this.backing_.getMetadataByIdInPath(trace, this.path, new Set(ids.value));
      if (!metadataByIds.ok) {
        return generalizeFailureResult(trace, metadataByIds, ['not-found', 'wrong-type']);
      }

      const idsWithMissingHashes = objectKeys(metadataByIds.value).filter((id) => metadataByIds.value[id]?.hash === undefined);
      if (idsWithMissingHashes.length === 0) {
        return makeSuccess(metadataByIds.value);
      }

      const gotMissingHashes = await allResultsMapped(
        trace,
        objectEntries(metadataByIds.value),
        {},
        async (trace, [itemId, metadata]): PR<undefined> => {
          if (metadata === undefined) {
            return makeSuccess(undefined);
          }

          const getPath = this.path.append(itemId);

          const itemType = extractSyncableItemTypeFromId(itemId);
          const itemAccessor = this.makeItemAccessor_(getPath, itemType);

          const hash = await itemAccessor.getHash(trace);
          if (!hash.ok) {
            return hash;
          }

          // Mutating previously fetched metadata
          metadata.hash = hash.value;

          return makeSuccess(undefined);
        }
      );
      if (!gotMissingHashes.ok) {
        return gotMissingHashes;
      }

      return makeSuccess(metadataByIds.value);
    }
  );

  public readonly getIds = makeAsyncResultFunc(
    [import.meta.filename, 'getIds'],
    async (trace: Trace, options?: { type?: SingleOrArray<SyncableItemType> }): PR<SyncableId[]> => {
      const ids = await this.backing_.getIdsInPath(trace, this.path, {
        type: intersectSyncableItemTypes(options?.type, syncableItemTypes.exclude('folder'))
      });
      if (!ids.ok) {
        return generalizeFailureResult(trace, ids, ['not-found', 'wrong-type']);
      }

      const isEncrypted = this.isEncrypted_();
      const idsWithMatchingEncryptionMode = ids.value.filter((id) => isSyncableItemEncrypted(id) === isEncrypted);

      const nonDeletedIds = await this.filterOutDeletedIds_(trace, idsWithMatchingEncryptionMode);
      if (!nonDeletedIds.ok) {
        return nonDeletedIds;
      }

      return makeSuccess(nonDeletedIds.value);
    }
  );

  public readonly get = makeAsyncResultFunc(
    [import.meta.filename, 'get'],
    async <T extends SyncableItemType = SyncableItemType>(
      trace: Trace,
      id: SyncableId,
      expectedType?: SingleOrArray<T>
    ): PR<SyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> =>
      await this.getMutable(trace, id, expectedType)
  );

  public readonly getMetadata = makeAsyncResultFunc([import.meta.filename, 'getMetadata'], async (trace): PR<SyncableItemMetadata> => {
    const metadata = await this.backing_.getMetadataAtPath(trace, this.path);
    if (!metadata.ok) {
      return generalizeFailureResult(trace, metadata, ['not-found', 'wrong-type']);
    }

    return makeSuccess(metadata.value);
  });

  public readonly markNeedsRecomputeHash = makeAsyncResultFunc(
    [import.meta.filename, 'markNeedsRecomputeHash'],
    async (trace): PR<undefined> => {
      const updatedHash = await this.backing_.updateLocalMetadataAtPath(trace, this.path, { hash: undefined });
      if (!updatedHash.ok) {
        return generalizeFailureResult(trace, updatedHash, ['not-found', 'wrong-type']);
      }

      this.needsRecomputeHashCount_ += 1;

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

  public readonly ls = makeAsyncResultFunc([import.meta.filename, 'ls'], async (trace): PR<string[]> => {
    const metadataById = await this.getMetadataById(trace);
    if (!metadataById.ok) {
      return metadataById;
    }

    const recursiveLs = await allResultsMapped(
      trace,
      objectEntries(metadataById.value).sort(),
      {},
      async (trace, [itemId, metadata]): PR<string[]> => {
        if (metadata === undefined) {
          return makeSuccess([]);
        }

        const itemPath = this.path.append(itemId);

        const dynamicName = await this.folderOperationsHandler_.getDynamicName(trace, metadata.name);

        const output: string[] = [`${itemId}${dynamicName.ok ? ` (${JSON.stringify(dynamicName.value)})` : ''}: ${metadata.hash}`];
        const itemType = extractSyncableItemTypeFromId(itemId);
        switch (itemType) {
          case 'folder':
            break; // This won't happen
          case 'bundle': {
            const itemAccessor = this.makeItemAccessor_(itemPath, itemType);
            const fileLs = await itemAccessor.ls(trace);
            if (!fileLs.ok) {
              return fileLs;
            }
            // Indenting
            output.push(...fileLs.value.map((value) => `  ${value}`));

            break;
          }
          case 'file':
            break; // Nothing to do
        }

        return makeSuccess(output);
      }
    );
    if (!recursiveLs.ok) {
      return recursiveLs;
    }

    return makeSuccess(flatten(recursiveLs.value));
  });

  // BundleManagement Methods

  public readonly sweep = makeAsyncResultFunc([import.meta.filename, 'sweep'], async (trace: Trace): PR<undefined> => {
    if (!this.supportsDeletion) {
      return makeSuccess(undefined);
    }

    const allItemIds = await this.backing_.getIdsInPath(trace, this.path, { type: syncableItemTypes.exclude('folder') });
    if (!allItemIds.ok) {
      return generalizeFailureResult(trace, allItemIds, ['not-found', 'wrong-type']);
    } else if (allItemIds.value.length === 0) {
      return makeSuccess(undefined);
    }

    const deleteIds = new Set<SyncableId>();
    for (const id of allItemIds.value) {
      const isDeleted = await this.folderOperationsHandler_.isPathMarkedAsDeleted(trace, this.path.append(id));
      if (!isDeleted.ok) {
        return isDeleted;
      }
      if (isDeleted.value) {
        deleteIds.add(id);
      }
    }

    const deletedInBacking = await allResultsMapped(trace, Array.from(deleteIds), {}, (trace, itemId) =>
      this.backing_.deleteAtPath(trace, this.path.append(itemId))
    );
    if (!deletedInBacking.ok) {
      return generalizeFailureResult(trace, deletedInBacking, ['not-found', 'wrong-type']);
    }

    const subBundleIds = await this.backing_.getIdsInPath(trace, this.path, { type: 'bundle' });
    if (!subBundleIds.ok) {
      return generalizeFailureResult(trace, subBundleIds, ['not-found', 'wrong-type']);
    }
    const recursivelySwept = await allResultsMapped(trace, subBundleIds.value, {}, async (trace, bundleId) => {
      const itemAccessor = this.makeMutableItemAccessor_(this.path.append(bundleId), 'bundle');
      return await itemAccessor.sweep(trace);
    });
    /* node:coverage disable */
    if (!recursivelySwept.ok) {
      return recursivelySwept;
    }
    /* node:coverage enable */

    return makeSuccess(undefined);
  });

  // Private Methods

  private readonly createPreEncodedBinaryFile_ = makeAsyncResultFunc(
    [import.meta.filename, 'createPreEncodedBinaryFile_'],
    async (
      trace: Trace,
      id: SyncableId,
      encodedData: Uint8Array,
      metadata: SyncableItemMetadata & LocalItemMetadata
    ): PR<MutableSyncableFileAccessor, 'conflict' | 'deleted'> => {
      const newPath = this.path.append(id);

      const exists = await this.backing_.existsAtPath(trace, newPath);
      if (!exists.ok) {
        return exists;
      } else if (exists.value) {
        return makeFailure(new ConflictError(trace, { message: `${newPath.toString()} already exists`, errorCode: 'conflict' }));
      }

      const guards = await this.guardNotDeleted_(trace, newPath, 'deleted');
      if (!guards.ok) {
        return guards;
      }

      const hash = await this.computeHash_(trace, encodedData);
      /* node:coverage disable */
      if (!hash.ok) {
        return hash;
      }
      /* node:coverage enable */

      // Never using a hash from metadata
      metadata.hash = hash.value;

      const createdFile = await this.backing_.createBinaryFileWithPath(trace, newPath, {
        data: encodedData,
        metadata
      });
      if (!createdFile.ok) {
        return generalizeFailureResult(trace, createdFile, ['not-found', 'wrong-type']);
      }

      const itemAccessor = this.makeItemAccessor_(newPath, 'file');

      const marked = await itemAccessor.markNeedsRecomputeHash(trace);
      /* node:coverage disable */
      if (!marked.ok) {
        return marked;
      }
      /* node:coverage enable */

      DEV: debugTopic('SYNC', (log) => log(`Notifying itemAdded for file ${newPath.toString()}`));
      this.syncTracker_.notify('itemAdded', {
        type: 'file',
        path: newPath,
        hash: hash.value
      });

      return makeSuccess(itemAccessor);
    }
  );

  public readonly createPreEncodedBundle_ = makeAsyncResultFunc(
    [import.meta.filename, 'createPreEncodedBundle_'],
    async (
      trace,
      id: SyncableId,
      metadata: SyncableItemMetadata & LocalItemMetadata
    ): PR<MutableSyncableBundleAccessor, 'conflict' | 'deleted'> => {
      const newPath = this.path.append(id);

      const exists = await this.backing_.existsAtPath(trace, newPath);
      if (!exists.ok) {
        return exists;
      } else if (exists.value) {
        return makeFailure(new ConflictError(trace, { message: `${newPath.toString()} already exists`, errorCode: 'conflict' }));
      }

      const guards = await this.guardNotDeleted_(trace, newPath, 'deleted');
      if (!guards.ok) {
        return guards;
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

      // Never using a hash from metadata
      metadata.hash = hash.value;

      const createdBundle = await this.backing_.createFolderWithPath(trace, newPath, { metadata });
      if (!createdBundle.ok) {
        return generalizeFailureResult(trace, createdBundle, ['not-found', 'wrong-type']);
      }

      const itemAccessor = this.makeMutableItemAccessor_(newPath, 'bundle');

      const marked = await itemAccessor.markNeedsRecomputeHash(trace);
      /* node:coverage disable */
      if (!marked.ok) {
        return marked;
      }
      /* node:coverage enable */

      DEV: debugTopic('SYNC', (log) => log(`Notifying itemAdded for bundle ${newPath.toString()}`));
      this.syncTracker_.notify('itemAdded', {
        type: 'bundle',
        path: newPath,
        hash: hash.value
      });

      return makeSuccess(itemAccessor);
    }
  );

  private readonly filterOutDeletedIds_ = makeAsyncResultFunc(
    [import.meta.filename, 'filterOutDeletedIds_'],
    async (trace, encodedIds: SyncableId[]) => {
      if (!this.supportsDeletion) {
        return makeSuccess(encodedIds);
      }

      return await allResultsReduced(
        trace,
        encodedIds,
        {},
        async (_trace, id) => makeSuccess(id),
        async (trace, out, id) => {
          const isDeleted = await this.folderOperationsHandler_.isPathMarkedAsDeleted(trace, this.path.append(id));
          if (!isDeleted.ok) {
            return isDeleted;
          }

          if (!isDeleted.value) {
            out.push(id);
          }

          return makeSuccess(out);
        },
        [] as SyncableId[]
      );
    }
  );

  private readonly guardNotDeleted_ = makeAsyncResultFunc(
    [import.meta.filename, 'guardNotDeleted_'],
    async <ErrorCodeT extends string>(trace: Trace, path: SyncablePath, errorCode: ErrorCodeT): PR<undefined, ErrorCodeT> => {
      if (!this.supportsDeletion) {
        return makeSuccess(undefined);
      }

      const isDeleted = await this.folderOperationsHandler_.isPathMarkedAsDeleted(trace, path);
      if (!isDeleted.ok) {
        return isDeleted;
      } else if (isDeleted.value) {
        return makeFailure(new NotFoundError(trace, { message: `${path.toString()} was deleted`, errorCode }));
      }

      return makeSuccess(undefined);
    }
  );

  private makeItemAccessor_<T extends SyncableItemType>(path: SyncablePath, itemType: T): SyncableItemAccessor & { type: T } {
    return this.makeMutableItemAccessor_<T>(path, itemType);
  }

  private makeMutableItemAccessor_<T extends SyncableItemType>(path: SyncablePath, itemType: T): MutableSyncableItemAccessor & { type: T } {
    switch (itemType) {
      case 'folder':
        throw new Error("Folders can't be managed by DefaultBundleBase");

      case 'bundle':
        return this.makeBundleAccessor_({ path }) as any as MutableSyncableItemAccessor & { type: T };

      case 'file':
        return this.makeFileAccessor_({ path }) as any as MutableSyncableItemAccessor & { type: T };
    }
  }
}
