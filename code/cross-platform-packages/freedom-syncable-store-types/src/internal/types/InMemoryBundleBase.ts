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
import { objectEntries } from 'freedom-cast';
import { ConflictError, generalizeFailureResult, InternalStateError, NotFoundError } from 'freedom-common-errors';
import { type Trace } from 'freedom-contexts';
import { generateSha256HashForEmptyString, generateSha256HashFromBuffer, generateSha256HashFromHashesById } from 'freedom-crypto';
import { extractPartsFromTimeId, extractPartsFromTrustedTimeId, timeIdInfo, trustedTimeIdInfo } from 'freedom-crypto-data';
import type { StorableObject } from 'freedom-object-store-types';
import type { DynamicSyncableId, StaticSyncablePath, SyncableId, SyncableItemType, SyncableProvenance } from 'freedom-sync-types';
import { areDynamicSyncableIdsEqual, syncableEncryptedIdInfo } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import { flatten } from 'lodash-es';
import type { SingleOrArray } from 'yaschema';

import type { BundleManagement } from '../../types/BundleManagement.ts';
import type { GenerateNewSyncableItemIdFunc } from '../../types/GenerateNewSyncableItemIdFunc.ts';
import type { MutableBundleFileAccessor } from '../../types/MutableBundleFileAccessor.ts';
import type { MutableFileStore } from '../../types/MutableFileStore.ts';
import type { MutableFlatFileAccessor } from '../../types/MutableFlatFileAccessor.ts';
import type { MutableSyncableItemAccessor } from '../../types/MutableSyncableItemAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SyncableItemAccessor } from '../../types/SyncableItemAccessor.ts';
import type { SyncTracker } from '../../types/SyncTracker.ts';
import { generateProvenanceForFileAtPath } from '../../utils/generateProvenanceForFileAtPath.ts';
import { generateProvenanceForFolderLikeItemAtPath } from '../../utils/generateProvenanceForFolderLikeItemAtPath.ts';
import { guardIsExpectedType } from '../../utils/guards/guardIsExpectedType.ts';
import { markSyncableNeedsRecomputeHashAtPath } from '../../utils/markSyncableNeedsRecomputeHashAtPath.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';
import { InMemoryMutableBundleFileAccessor } from './InMemoryMutableBundleFileAccessor.ts';
import { InMemoryMutableFlatFileAccessor } from './InMemoryMutableFlatFileAccessor.ts';

interface InternalFlatFile {
  type: 'flatFile';
  accessor: InMemoryMutableFlatFileAccessor;
}

interface InternalBundleFile {
  type: 'bundleFile';
  accessor: InMemoryMutableBundleFileAccessor;
}

type AnyFile = InternalFlatFile | InternalBundleFile;

export interface InMemoryBundleBaseConstructorArgs {
  store: WeakRef<MutableSyncableStore>;
  syncTracker: SyncTracker;
  folderOperationsHandler: FolderOperationsHandler;
  path: StaticSyncablePath;
  provenance: SyncableProvenance;
  supportsDeletion: boolean;
}

export abstract class InMemoryBundleBase implements MutableFileStore, BundleManagement {
  public readonly path: StaticSyncablePath;
  public readonly supportsDeletion: boolean;

  protected readonly weakStore_: WeakRef<MutableSyncableStore>;
  protected readonly syncTracker_: SyncTracker;
  protected readonly folderOperationsHandler_: FolderOperationsHandler;

  private readonly files_ = new Map<SyncableId, StorableObject<AnyFile>>();

  private hash_: Sha256Hash | undefined;
  private readonly provenance_: SyncableProvenance;
  private needsRecomputeHashCount_ = 0;

  constructor({ store, syncTracker, folderOperationsHandler, path, provenance, supportsDeletion }: InMemoryBundleBaseConstructorArgs) {
    this.supportsDeletion = supportsDeletion;
    this.weakStore_ = store;
    this.syncTracker_ = syncTracker;
    this.folderOperationsHandler_ = folderOperationsHandler;
    this.path = path;
    this.provenance_ = provenance;
  }

  // Abstract Methods

  protected abstract computeHash_(trace: Trace, encodedData: Uint8Array): PR<Sha256Hash>;
  protected abstract decodeData_(trace: Trace, encodedData: Uint8Array): PR<Uint8Array>;
  protected abstract encodeData_(trace: Trace, rawData: Uint8Array): PR<Uint8Array>;
  protected abstract newBundle_(trace: Trace, args: { path: StaticSyncablePath; provenance: SyncableProvenance }): PR<InMemoryBundleBase>;

  // MutableFileStore Methods

  public readonly createBinaryFile: MutableFileStore['createBinaryFile'] = makeAsyncResultFunc(
    [import.meta.filename, 'createBinaryFile'],
    async (trace: Trace, args): PR<MutableFlatFileAccessor, 'conflict' | 'deleted'> => {
      switch (args.mode) {
        case 'via-sync':
          return this.createPreEncodedBinaryFile_(trace, args.id, args.encodedValue, args.provenance);
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

          const id = await this.folderOperationsHandler_.generateNewSyncableItemId(trace, {
            id: args.id,
            parentPath: this.path,
            getSha256ForItemProvenance
          });
          /* node:coverage disable */
          if (!id.ok) {
            return id;
          }
          /* node:coverage enable */

          const newPath = this.path.append(id.value);

          const provenance = await generateProvenanceForFileAtPath(trace, store, { path: newPath, getSha256ForItemProvenance });
          if (!provenance.ok) {
            return provenance;
          }

          return this.createPreEncodedBinaryFile_(trace, id.value, encodedData.value, provenance.value);
        }
      }
    }
  );

  public readonly createBundleFile: MutableFileStore['createBundleFile'] = makeAsyncResultFunc(
    [import.meta.filename, 'createBundleFile'],
    async (trace, args): PR<MutableBundleFileAccessor, 'conflict' | 'deleted'> => {
      switch (args.mode) {
        case 'via-sync':
          return this.createPreEncodedBundleFile_(trace, args.id, args.provenance);
        case undefined:
        case 'local': {
          const store = this.weakStore_.deref();
          if (store === undefined) {
            return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
          }

          const id = await this.folderOperationsHandler_.generateNewSyncableItemId(trace, {
            id: args.id,
            parentPath: this.path,
            getSha256ForItemProvenance: generateSha256HashForEmptyString
          });
          /* node:coverage disable */
          if (!id.ok) {
            return id;
          }
          /* node:coverage enable */

          const provenance = await generateProvenanceForFolderLikeItemAtPath(trace, store, { path: this.path.append(id.value) });
          if (!provenance.ok) {
            return provenance;
          }

          return this.createPreEncodedBundleFile_(trace, id.value, provenance.value);
        }
      }
    }
  );

  public readonly delete = makeAsyncResultFunc(
    [import.meta.filename, 'delete'],
    async (trace, id: DynamicSyncableId): PR<undefined, 'not-found'> => {
      if (typeof id !== 'string') {
        const staticId = await this.dynamicToStaticId(trace, id);
        if (!staticId.ok) {
          return staticId;
        }

        id = staticId.value;
      }

      if (!this.supportsDeletion) {
        return makeFailure(new InternalStateError(trace, { message: `Deletion is not supported in ${this.path.toString()}` }));
      }

      const removePath = this.path.append(id);

      const file = this.files_.get(id);
      /* node:coverage disable */
      if (file === undefined) {
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

  public readonly exists = makeAsyncResultFunc([import.meta.filename, 'exists'], async (trace, id: DynamicSyncableId): PR<boolean> => {
    if (typeof id !== 'string') {
      const staticId = await this.dynamicToStaticId(trace, id);
      if (!staticId.ok) {
        if (staticId.value.errorCode === 'not-found') {
          return makeSuccess(false);
        }
        return excludeFailureResult(staticId, 'not-found');
      }

      id = staticId.value;
    }

    if (!this.files_.has(id)) {
      return makeSuccess(false);
    }

    const guards = await disableLam(trace, true, (trace) => this.guardNotDeleted_(trace, this.path.append(id), 'deleted'));
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
      id: DynamicSyncableId,
      expectedType?: SingleOrArray<T>
    ): PR<MutableSyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'wrong-type'> => {
      if (typeof id !== 'string') {
        const staticId = await this.dynamicToStaticId(trace, id);
        if (!staticId.ok) {
          return staticId;
        }

        id = staticId.value;
      }

      const file = this.files_.get(id);
      if (file === undefined) {
        return makeFailure(
          new NotFoundError(trace, {
            message: `No file found for ID: ${id} in ${this.path.toString()}`,
            errorCode: 'not-found'
          })
        );
      }

      const guards = await allResults(trace, [
        this.guardNotDeleted_(trace, this.path.append(id), 'deleted'),
        guardIsExpectedType(trace, this.path.append(id), file.storedValue, expectedType, 'wrong-type')
      ]);
      if (!guards.ok) {
        return guards;
      }

      return makeSuccess(file.storedValue.accessor as any as MutableSyncableItemAccessor & { type: T });
    }
  );

  public readonly generateNewSyncableItemId: GenerateNewSyncableItemIdFunc = (trace, args) =>
    this.folderOperationsHandler_.generateNewSyncableItemId(trace, args);

  public readonly staticToDynamicId = (trace: Trace, id: SyncableId): PR<DynamicSyncableId> =>
    this.folderOperationsHandler_.staticToDynamicId(trace, id);

  // FileStore Methods

  public readonly getHash = makeAsyncResultFunc(
    [import.meta.filename, 'getHash'],
    async (trace, { recompute = false }: { recompute?: boolean } = {}): PR<Sha256Hash> => {
      if (this.hash_ !== undefined && !recompute) {
        return makeSuccess(this.hash_);
      }

      do {
        const needsRecomputeHashCount = this.needsRecomputeHashCount_;

        const hashesById = await this.getHashesById(trace, { recompute });
        /* node:coverage disable */
        if (!hashesById.ok) {
          return hashesById;
        }
        /* node:coverage enable */

        const hash = await generateSha256HashFromHashesById(trace, hashesById.value);
        /* node:coverage disable */
        if (!hash.ok) {
          return hash;
        }
        /* node:coverage enable */

        if (this.needsRecomputeHashCount_ === needsRecomputeHashCount) {
          this.hash_ = hash.value;
          return makeSuccess(hash.value);
        }
      } while (true);
    }
  );

  public readonly getHashesById = makeAsyncResultFunc(
    [import.meta.filename, 'getHashesById'],
    async (trace: Trace, { recompute = false }: { recompute?: boolean } = {}): PR<Partial<Record<SyncableId, Sha256Hash>>> => {
      // Deleted files are already filtered out using getIds
      const ids = await this.getIds(trace);
      /* node:coverage disable */
      if (!ids.ok) {
        return ids;
      }
      /* node:coverage enable */

      return allResultsReduced(
        trace,
        ids.value,
        {},
        async (trace, fileId): PR<Sha256Hash | undefined> => {
          const file = this.files_.get(fileId);
          if (file === undefined) {
            return makeSuccess(undefined);
          }

          return file.storedValue.accessor.getHash(trace, { recompute });
        },
        async (_trace, out, hash, fileId) => {
          if (hash === undefined) {
            return makeSuccess(out);
          }

          out[fileId] = hash;
          return makeSuccess(out);
        },
        {} as Partial<Record<string, Sha256Hash>>
      );
    }
  );

  public readonly dynamicToStaticId = makeAsyncResultFunc(
    [import.meta.filename, 'dynamicToStaticId'],
    async (trace, dynamicId: DynamicSyncableId): PR<SyncableId, 'not-found'> => {
      // Deleted files are already filtered out using getIds
      const ids = await this.getIds(trace);
      /* node:coverage disable */
      if (!ids.ok) {
        return ids;
      }
      /* node:coverage enable */

      // TODO: this is very inefficient, we should have a map for this / cache after computing once
      for (const id of ids.value) {
        if (typeof dynamicId === 'string') {
          if (id === dynamicId) {
            return makeSuccess(id);
          }
        } else {
          switch (dynamicId.type) {
            case 'encrypted':
              if (syncableEncryptedIdInfo.is(id)) {
                const foundId = await this.staticToDynamicId(trace, id);
                if (!foundId.ok) {
                  continue;
                }

                if (areDynamicSyncableIdsEqual(foundId.value, dynamicId)) {
                  return makeSuccess(id);
                }
              }
              break;

            case 'time':
              if (timeIdInfo.is(id)) {
                const timeIdParts = await extractPartsFromTimeId(trace, id);
                if (!timeIdParts.ok) {
                  continue;
                }

                if (timeIdParts.value.uuid === dynamicId.uuid) {
                  return makeSuccess(id);
                }
              } else if (trustedTimeIdInfo.is(id)) {
                const timeIdParts = await extractPartsFromTrustedTimeId(trace, id);
                if (!timeIdParts.ok) {
                  continue;
                }

                if (timeIdParts.value.uuid === dynamicId.uuid) {
                  return makeSuccess(id);
                }
              }
              break;
          }
        }
      }

      return makeFailure(
        new NotFoundError(trace, { message: `No encoded ID found for dynamic ID ${JSON.stringify(dynamicId)}`, errorCode: 'not-found' })
      );
    }
  );

  public readonly getIds = makeAsyncResultFunc(
    [import.meta.filename, 'getIds'],
    async (trace: Trace, options?: { type?: SingleOrArray<SyncableItemType> }): PR<SyncableId[]> =>
      this.filterOutDeletedIds_(trace, this.filterIdsByType_(Array.from(this.files_.keys()), options?.type))
  );

  public readonly get = makeAsyncResultFunc(
    [import.meta.filename, 'get'],
    async <T extends SyncableItemType = SyncableItemType>(
      trace: Trace,
      id: DynamicSyncableId,
      expectedType?: SingleOrArray<T>
    ): PR<SyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'wrong-type'> => this.getMutable(trace, id, expectedType)
  );

  public readonly getProvenance = makeAsyncResultFunc(
    [import.meta.filename, 'getProvenance'],
    async (_trace): PR<SyncableProvenance> => makeSuccess(this.provenance_)
  );

  public readonly markNeedsRecomputeHash = makeAsyncResultFunc(
    [import.meta.filename, 'markNeedsRecomputeHash'],
    async (trace): PR<undefined> => {
      this.hash_ = undefined;
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
    const hashesByFileId = await this.getHashesById(trace);
    if (!hashesByFileId.ok) {
      return hashesByFileId;
    }

    const recursiveLs = await allResultsMapped(
      trace,
      objectEntries(hashesByFileId.value).sort((a, b) => a[0].localeCompare(b[0])),
      {},
      async (trace, [fileId, hash]): PR<string[]> => {
        const file = this.files_.get(fileId);
        if (file === undefined) {
          return makeSuccess([]);
        }

        const output: string[] = [`${fileId}: ${hash}`];
        switch (file.storedValue.type) {
          case 'bundleFile': {
            const fileLs = await file.storedValue.accessor.ls(trace);
            if (!fileLs.ok) {
              return fileLs;
            }
            // Indenting
            output.push(...fileLs.value.map((value) => `  ${value}`));

            break;
          }
          case 'flatFile':
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

    const allFileIds = Array.from(this.files_.keys());
    if (allFileIds.length === 0) {
      return makeSuccess(undefined);
    }

    const deleteIds = new Set<SyncableId>();
    for (const id of allFileIds) {
      const isDeleted = await this.folderOperationsHandler_.isPathMarkedAsDeleted(trace, this.path.append(id));
      if (!isDeleted.ok) {
        return isDeleted;
      }
      if (isDeleted.value) {
        deleteIds.add(id);
      }
    }

    for (const id of deleteIds) {
      this.files_.delete(id);
    }

    const recursivelySwept = await allResultsMapped(trace, Array.from(this.files_.values()), {}, async (trace, file) => {
      switch (file.storedValue.type) {
        case 'bundleFile':
          return file.storedValue.accessor.sweep(trace);
        case 'flatFile':
          return makeSuccess(undefined);
      }
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
      provenance: SyncableProvenance
    ): PR<MutableFlatFileAccessor, 'conflict' | 'deleted'> => {
      const newPath = this.path.append(id);

      if (this.files_.has(id)) {
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

      const storable: StorableObject<InternalFlatFile> = {
        storedValue: {
          type: 'flatFile',
          accessor: new InMemoryMutableFlatFileAccessor({
            store: this.weakStore_,
            path: newPath,
            data: encodedData,
            hash: hash.value,
            provenance,
            decode: (trace, encodedData) => this.decodeData_(trace, encodedData)
          })
        },
        updateCount: 0
      };

      this.files_.set(id, storable);

      const marked = await storable.storedValue.accessor.markNeedsRecomputeHash(trace);
      /* node:coverage disable */
      if (!marked.ok) {
        return marked;
      }
      /* node:coverage enable */

      DEV: debugTopic('SYNC', (log) => log(`Notifying needsSync for flat file ${newPath.toString()}`));
      this.syncTracker_.notify('needsSync', {
        type: 'flatFile',
        path: newPath,
        hash: hash.value
      });

      return makeSuccess(storable.storedValue.accessor);
    }
  );

  public readonly createPreEncodedBundleFile_ = makeAsyncResultFunc(
    [import.meta.filename, 'createPreEncodedBundleFile_'],
    async (trace, id: SyncableId, provenance: SyncableProvenance): PR<MutableBundleFileAccessor, 'conflict' | 'deleted'> => {
      const newPath = this.path.append(id);

      if (this.files_.has(id)) {
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

      const bundle = await this.newBundle_(trace, { path: newPath, provenance });
      if (!bundle.ok) {
        return bundle;
      }

      const hash = await generateSha256HashFromHashesById(trace, {});
      /* node:coverage disable */
      if (!hash.ok) {
        return hash;
      }
      /* node:coverage enable */

      const storable: StorableObject<InternalBundleFile> = {
        storedValue: {
          type: 'bundleFile',
          accessor: new InMemoryMutableBundleFileAccessor({
            store: this.weakStore_,
            path: newPath,
            data: bundle.value
          })
        },
        updateCount: 0
      };

      this.files_.set(id, storable);

      const marked = await storable.storedValue.accessor.markNeedsRecomputeHash(trace);
      /* node:coverage disable */
      if (!marked.ok) {
        return marked;
      }
      /* node:coverage enable */

      DEV: debugTopic('SYNC', (log) => log(`Notifying needsSync for bundle ${newPath.toString()}`));
      this.syncTracker_.notify('needsSync', {
        type: 'bundleFile',
        path: newPath,
        hash: hash.value
      });

      return makeSuccess(storable.storedValue.accessor);
    }
  );

  private readonly filterIdsByType_ = (encodedIds: SyncableId[], type?: SingleOrArray<SyncableItemType>): SyncableId[] =>
    type === undefined
      ? encodedIds
      : encodedIds.filter((id) => {
          const found = this.files_.get(id);
          if (found === undefined) {
            return false;
          }

          return Array.isArray(type) ? type.includes(found.storedValue.type) : type === found.storedValue.type;
        });

  private readonly filterOutDeletedIds_ = makeAsyncResultFunc(
    [import.meta.filename, 'filterOutDeletedIds_'],
    async (trace, encodedIds: SyncableId[]) => {
      if (!this.supportsDeletion) {
        return makeSuccess(encodedIds);
      }

      return allResultsReduced(
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
    async <ErrorCodeT extends string>(trace: Trace, path: StaticSyncablePath, errorCode: ErrorCodeT): PR<undefined, ErrorCodeT> => {
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
}
