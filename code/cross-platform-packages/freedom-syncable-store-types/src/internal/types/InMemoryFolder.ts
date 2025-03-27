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
import { generateSha256HashForEmptyString, generateSha256HashFromHashesById } from 'freedom-crypto';
import { extractPartsFromTimeId, extractPartsFromTrustedTimeId, timeIdInfo, trustedTimeIdInfo } from 'freedom-crypto-data';
import type { DynamicSyncableId, StaticSyncablePath, SyncableId, SyncableItemType, SyncableProvenance } from 'freedom-sync-types';
import { areDynamicSyncableIdsEqual, invalidProvenance, syncableEncryptedIdInfo } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import { flatten } from 'lodash-es';
import type { SingleOrArray } from 'yaschema';

import type { FolderManagement } from '../../types/FolderManagement.ts';
import type { GenerateNewSyncableItemIdFunc } from '../../types/GenerateNewSyncableItemIdFunc.ts';
import type { MutableAccessControlledFolderAccessor } from '../../types/MutableAccessControlledFolderAccessor.ts';
import type { MutableFolderStore } from '../../types/MutableFolderStore.ts';
import type { MutableSyncableItemAccessor } from '../../types/MutableSyncableItemAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SyncableItemAccessor } from '../../types/SyncableItemAccessor.ts';
import type { SyncTracker } from '../../types/SyncTracker.ts';
import { generateProvenanceForFolderLikeItemAtPath } from '../../utils/generateProvenanceForFolderLikeItemAtPath.ts';
import { guardIsExpectedType } from '../../utils/guards/guardIsExpectedType.ts';
import { markSyncableNeedsRecomputeHashAtPath } from '../../utils/markSyncableNeedsRecomputeHashAtPath.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';
import { InMemoryAccessControlledFolder } from './InMemoryAccessControlledFolder.ts';

type InternalFolder = InMemoryAccessControlledFolder;

export class InMemoryFolder implements MutableFolderStore, FolderManagement {
  public readonly path: StaticSyncablePath;

  private readonly syncTracker_: SyncTracker;

  private readonly weakStore_: WeakRef<MutableSyncableStore>;

  private readonly folders_ = new Map<SyncableId, InternalFolder>();
  private readonly folderOperationsHandler_: FolderOperationsHandler;

  private hash_: Sha256Hash | undefined;
  private needsRecomputeHashCount_ = 0;

  constructor({
    store,
    syncTracker,
    folderOperationsHandler,
    path
  }: {
    store: WeakRef<MutableSyncableStore>;
    syncTracker: SyncTracker;
    folderOperationsHandler: FolderOperationsHandler;
    path: StaticSyncablePath;
  }) {
    this.weakStore_ = store;
    this.syncTracker_ = syncTracker;
    this.folderOperationsHandler_ = folderOperationsHandler;
    this.path = path;
  }

  // MutableFolderStore Methods

  public readonly createFolder: MutableFolderStore['createFolder'] = makeAsyncResultFunc(
    [import.meta.filename, 'createFolder'],
    async (trace, args): PR<MutableAccessControlledFolderAccessor, 'conflict' | 'deleted'> => {
      switch (args.mode) {
        case 'via-sync':
          return await this.createPreEncodedFolder_(trace, args.id, args.metadata.provenance);
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

          const folder = await this.createPreEncodedFolder_(trace, id.value, provenance.value);
          if (!folder.ok) {
            return folder;
          }

          // Initializing folder

          const accessInitialized = await folder.value.initialize(trace);
          if (!accessInitialized.ok) {
            return accessInitialized;
          }

          return makeSuccess(folder.value);
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

      const removePath = this.path.append(id);

      const folder = this.folders_.get(id);
      /* node:coverage disable */
      if (folder === undefined) {
        return makeFailure(
          new NotFoundError(trace, {
            message: `No folder found for ID: ${id} in ${this.path.toString()}`,
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

      const markedNeedsRecomputedHash = await folder.markNeedsRecomputeHash(trace);
      /* node:coverage disable */
      if (!markedNeedsRecomputedHash.ok) {
        return markedNeedsRecomputedHash;
      }
      /* node:coverage enable */

      DEV: debugTopic('SYNC', (log) => log(`Notifying folderRemoved for folder ${removePath.toString()}`));
      this.syncTracker_.notify('folderRemoved', { path: removePath });

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

    if (!this.folders_.has(id)) {
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

      const folder = this.folders_.get(id);
      /* node:coverage disable */
      if (folder === undefined) {
        return makeFailure(
          new NotFoundError(trace, {
            message: `No folder found for ID: ${id} in ${this.path.toString()}`,
            errorCode: 'not-found'
          })
        );
      }
      /* node:coverage enable */

      const guards = await allResults(trace, [
        this.guardNotDeleted_(trace, this.path.append(id), 'deleted'),
        guardIsExpectedType(trace, this.path.append(id), folder, expectedType, 'wrong-type')
      ]);
      if (!guards.ok) {
        return generalizeFailureResult(trace, guards, 'wrong-type');
      }

      return makeSuccess(folder as any as MutableSyncableItemAccessor & { type: T });
    }
  );

  public readonly generateNewSyncableItemId: GenerateNewSyncableItemIdFunc = (trace, args) =>
    this.folderOperationsHandler_.generateNewSyncableItemId(trace, args);

  public readonly staticToDynamicId = (trace: Trace, id: SyncableId): PR<DynamicSyncableId> =>
    this.folderOperationsHandler_.staticToDynamicId(trace, id);

  // FolderStore Methods

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
    async (trace, { recompute = false }: { recompute?: boolean } = {}): PR<Partial<Record<SyncableId, Sha256Hash>>> => {
      // Deleted folders are already filtered out using getIds
      const ids = await this.getIds(trace);
      /* node:coverage disable */
      if (!ids.ok) {
        return ids;
      }
      /* node:coverage enable */

      return await allResultsReduced(
        trace,
        ids.value,
        {},
        async (trace, folderId): PR<Sha256Hash | undefined> => {
          const folder = this.folders_.get(folderId);
          if (folder === undefined) {
            return makeSuccess(undefined);
          }

          return await folder.getHash(trace, { recompute });
        },
        async (_trace, out, hash, folderId) => {
          out[folderId] = hash;
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
      await this.filterOutDeletedIds_(trace, this.filterIdsByType_(Array.from(this.folders_.keys()), options?.type))
  );

  public readonly get = makeAsyncResultFunc(
    [import.meta.filename, 'get'],
    async <T extends SyncableItemType = SyncableItemType>(
      trace: Trace,
      id: DynamicSyncableId,
      expectedType?: SingleOrArray<T>
    ): PR<SyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'wrong-type'> => await this.getMutable(trace, id, expectedType)
  );

  public readonly getProvenance = makeAsyncResultFunc(
    [import.meta.filename, 'getProvenance'],
    async (_trace): PR<SyncableProvenance> => makeSuccess(invalidProvenance)
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
    const hashesByFolderId = await this.getHashesById(trace);
    if (!hashesByFolderId.ok) {
      return hashesByFolderId;
    }

    const recursiveLs = await allResultsMapped(
      trace,
      objectEntries(hashesByFolderId.value).sort((a, b) => a[0].localeCompare(b[0])),
      {},
      async (trace, [folderId, hash]): PR<string[]> => {
        const folder = this.folders_.get(folderId);
        if (folder === undefined) {
          return makeSuccess([]);
        }

        const dynamicId = await this.staticToDynamicId(trace, folderId);

        const output: string[] = [`${dynamicId.ok ? JSON.stringify(dynamicId.value) : folderId}: ${hash}`];
        const folderLs = await folder.ls(trace);
        if (!folderLs.ok) {
          return folderLs;
        }

        // Indenting
        output.push(...folderLs.value.map((value) => `  ${value}`));

        return makeSuccess(output);
      }
    );
    if (!recursiveLs.ok) {
      return recursiveLs;
    }

    return makeSuccess(flatten(recursiveLs.value));
  });

  // FileStoreManagementAccessor Methods

  public async sweep(trace: Trace): PR<undefined> {
    const allFolderIds = Array.from(this.folders_.keys());
    if (allFolderIds.length === 0) {
      return makeSuccess(undefined);
    }

    const deleteIds = new Set<SyncableId>();
    for (const id of allFolderIds) {
      const isDeleted = await this.folderOperationsHandler_.isPathMarkedAsDeleted(trace, this.path.append(id));
      if (!isDeleted.ok) {
        return isDeleted;
      }
      if (isDeleted.value) {
        deleteIds.add(id);
      }
    }

    for (const id of deleteIds) {
      this.folders_.delete(id);
    }

    const recursivelySwept = await allResultsMapped(
      trace,
      Array.from(this.folders_.values()),
      {},
      async (trace, folder) => await folder.sweep(trace)
    );
    /* node:coverage disable */
    if (!recursivelySwept.ok) {
      return recursivelySwept;
    }
    /* node:coverage enable */

    return makeSuccess(undefined);
  }

  // Private Methods

  private readonly createPreEncodedFolder_ = makeAsyncResultFunc(
    [import.meta.filename, 'createPreEncodedFolder_'],
    async (trace, id: SyncableId, provenance: SyncableProvenance): PR<InMemoryAccessControlledFolder, 'conflict' | 'deleted'> => {
      const newPath = this.path.append(id);

      const existingFolder = this.folders_.get(id);
      if (existingFolder !== undefined) {
        return makeFailure(new ConflictError(trace, { message: `${newPath.toString()} already exists`, errorCode: 'conflict' }));
      }

      const guards = await this.guardNotDeleted_(trace, newPath, 'deleted');
      if (!guards.ok) {
        return guards;
      }

      const folder = new InMemoryAccessControlledFolder({
        store: this.weakStore_,
        syncTracker: this.syncTracker_,
        path: newPath,
        provenance
      });

      this.folders_.set(id, folder);

      const hash = await generateSha256HashFromHashesById(trace, {});
      /* node:coverage disable */
      if (!hash.ok) {
        return hash;
      }
      /* node:coverage enable */

      const marked = await folder.markNeedsRecomputeHash(trace);
      /* node:coverage disable */
      if (!marked.ok) {
        return marked;
      }
      /* node:coverage enable */

      DEV: debugTopic('SYNC', (log) => log(`Notifying folderAdded for folder ${newPath.toString()}`));
      this.syncTracker_.notify('folderAdded', { path: newPath });

      DEV: debugTopic('SYNC', (log) => log(`Notifying needsSync for folder ${newPath.toString()}`));
      this.syncTracker_.notify('needsSync', {
        type: 'folder',
        path: newPath,
        hash: hash.value
      });

      return makeSuccess(folder);
    }
  );

  private readonly filterIdsByType_ = (encodedIds: SyncableId[], type?: SingleOrArray<SyncableItemType>): SyncableId[] =>
    type === undefined
      ? encodedIds
      : encodedIds.filter((id) => {
          const found = this.folders_.get(id);
          if (found === undefined) {
            return false;
          }

          return Array.isArray(type) ? type.includes('folder') : type === 'folder';
        });

  private readonly filterOutDeletedIds_ = makeAsyncResultFunc(
    [import.meta.filename, 'filterOutDeletedIds_'],
    async (trace, encodedIds: SyncableId[]) => {
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
    async <ErrorCodeT extends string>(trace: Trace, path: StaticSyncablePath, errorCode: ErrorCodeT): PR<undefined, ErrorCodeT> => {
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
