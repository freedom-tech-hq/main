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
import type {
  DynamicSyncableId,
  StaticSyncablePath,
  SyncableFolderMetadata,
  SyncableId,
  SyncableItemType,
  SyncableProvenance
} from 'freedom-sync-types';
import { areDynamicSyncableIdsEqual, invalidProvenance, syncableEncryptedIdInfo } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import { flatten } from 'lodash-es';
import type { SingleOrArray } from 'yaschema';

import type { LocalItemMetadata } from '../../types/backing/LocalItemMetadata.ts';
import type { SyncableStoreBacking } from '../../types/backing/SyncableStoreBacking.ts';
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
import { intersectSyncableItemTypes } from '../utils/intersectSyncableItemTypes.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';
import { InMemoryAccessControlledFolder } from './InMemoryAccessControlledFolder.ts';

// type InternalFolder = InMemoryAccessControlledFolder;

// TODO: rename to DefaultFolder in separate PR
export class InMemoryFolder implements MutableFolderStore, FolderManagement {
  public readonly path: StaticSyncablePath;

  private readonly syncTracker_: SyncTracker;

  private readonly weakStore_: WeakRef<MutableSyncableStore>;
  private readonly folderOperationsHandler_: FolderOperationsHandler;
  private readonly makeFolderAccessor_: (args: { path: StaticSyncablePath }) => MutableAccessControlledFolderAccessor;

  private readonly backing_: SyncableStoreBacking;
  // private readonly folders_ = new Map<SyncableId, InternalFolder>();

  private needsRecomputeHashCount_ = 0;

  constructor({
    store,
    backing,
    syncTracker,
    folderOperationsHandler,
    path,
    makeFolderAccessor
  }: {
    store: WeakRef<MutableSyncableStore>;
    backing: SyncableStoreBacking;
    syncTracker: SyncTracker;
    folderOperationsHandler: FolderOperationsHandler;
    path: StaticSyncablePath;
    makeFolderAccessor: (args: { path: StaticSyncablePath }) => MutableAccessControlledFolderAccessor;
  }) {
    this.weakStore_ = store;
    this.backing_ = backing;
    this.syncTracker_ = syncTracker;
    this.folderOperationsHandler_ = folderOperationsHandler;
    this.path = path;
    this.makeFolderAccessor_ = makeFolderAccessor;
  }

  // MutableFolderStore Methods

  public readonly createFolder: MutableFolderStore['createFolder'] = makeAsyncResultFunc(
    [import.meta.filename, 'createFolder'],
    async (trace, args): PR<MutableAccessControlledFolderAccessor, 'conflict' | 'deleted'> => {
      switch (args.mode) {
        case 'via-sync':
          return await this.createPreEncodedFolder_(trace, args.id, args.metadata);
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

          const folder = await this.createPreEncodedFolder_(trace, id.value, {
            type: 'folder',
            provenance: provenance.value,
            encrypted: true
          });
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

      // Checking that the requested file exists in the backing
      const exists = await this.backing_.existsAtPath(trace, removePath);
      /* node:coverage disable */
      if (!exists.ok) {
        return exists;
      } else if (!exists.value) {
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

      const markedNeedsRecomputedHash = await this.markNeedsRecomputeHash(trace);
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

      const getPath = this.path.append(id);

      const metadata = await this.backing_.getMetadataAtPath(trace, getPath);
      if (!metadata.ok) {
        return metadata;
      }

      const guards = await allResults(trace, [
        this.guardNotDeleted_(trace, getPath, 'deleted'),
        guardIsExpectedType(trace, getPath, metadata.value, intersectSyncableItemTypes(expectedType, 'folder'), 'wrong-type')
      ]);
      if (!guards.ok) {
        return guards;
      }

      return makeSuccess(this.makeMutableItemAccessor_<T>(getPath, metadata.value.type as T));
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
      const metadata = await this.backing_.getMetadataAtPath(trace, this.path);
      if (!metadata.ok) {
        return generalizeFailureResult(trace, metadata, ['not-found', 'wrong-type']);
      }

      const hash = metadata.value.hash;
      if (hash !== undefined && !recompute) {
        return makeSuccess(hash);
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
          const updatedMetadata = await this.backing_.updateLocalMetadataAtPath(trace, this.path, { hash: hash.value });
          if (!updatedMetadata.ok) {
            return generalizeFailureResult(trace, updatedMetadata, ['not-found', 'wrong-type']);
          }

          return makeSuccess(hash.value);
        }
      } while (true);
    }
  );

  public readonly getHashesById = makeAsyncResultFunc(
    [import.meta.filename, 'getHashesById'],
    async (trace: Trace, { recompute = false }: { recompute?: boolean } = {}): PR<Partial<Record<SyncableId, Sha256Hash>>> => {
      // Deleted files are already filtered out using getIds
      const ids = await this.getIds(trace, { type: 'folder' });
      /* node:coverage disable */
      if (!ids.ok) {
        return ids;
      }
      /* node:coverage enable */

      const metadataByIds = await this.backing_.getMetadataByIdInPath(trace, this.path, new Set(ids.value));
      if (!metadataByIds.ok) {
        return generalizeFailureResult(trace, metadataByIds, ['not-found', 'wrong-type']);
      }

      return await allResultsReduced(
        trace,
        objectEntries(metadataByIds.value),
        {},
        async (trace, [itemId, metadata]): PR<Sha256Hash | undefined> => {
          if (metadata === undefined) {
            return makeSuccess(undefined);
          }

          const getPath = this.path.append(itemId);

          const itemAccessor = this.makeItemAccessor_(getPath, metadata.type);

          return await itemAccessor.getHash(trace, { recompute });
        },
        async (_trace, out, hash, [itemId, _metadata]) => {
          if (hash === undefined) {
            return makeSuccess(out);
          }

          out[itemId] = hash;
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
    async (trace: Trace, options?: { type?: SingleOrArray<SyncableItemType> }): PR<SyncableId[]> => {
      const ids = await this.backing_.getIdsInPath(trace, this.path, {
        type: intersectSyncableItemTypes(options?.type, 'folder')
      });
      if (!ids.ok) {
        return generalizeFailureResult(trace, ids, ['not-found', 'wrong-type']);
      }

      return await this.filterOutDeletedIds_(trace, ids.value);
    }
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
      const updatedMetadata = await this.backing_.updateLocalMetadataAtPath(trace, this.path, { hash: undefined });
      if (!updatedMetadata.ok) {
        return generalizeFailureResult(trace, updatedMetadata, ['not-found', 'wrong-type']);
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
    const hashesByFolderId = await this.getHashesById(trace);
    if (!hashesByFolderId.ok) {
      return hashesByFolderId;
    }

    const recursiveLs = await allResultsMapped(
      trace,
      objectEntries(hashesByFolderId.value).sort((a, b) => a[0].localeCompare(b[0])),
      {},
      async (trace, [itemId, hash]): PR<string[]> => {
        const getPath = this.path.append(itemId);
        const metadata = await this.backing_.getMetadataAtPath(trace, getPath);
        if (!metadata.ok) {
          return generalizeFailureResult(trace, metadata, ['not-found', 'wrong-type']);
        }

        const dynamicId = await this.staticToDynamicId(trace, itemId);

        const output: string[] = [`${dynamicId.ok ? JSON.stringify(dynamicId.value) : itemId}: ${hash}`];
        switch (metadata.value.type) {
          case 'folder': {
            const itemAccessor = this.makeItemAccessor_(getPath, metadata.value.type);
            const fileLs = await itemAccessor.ls(trace);
            if (!fileLs.ok) {
              return fileLs;
            }
            // Indenting
            output.push(...fileLs.value.map((value) => `  ${value}`));

            break;
          }
          case 'bundleFile':
          case 'flatFile':
            break; // These won't happen
        }

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
    const allItemIds = await this.backing_.getIdsInPath(trace, this.path, { type: 'folder' });
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

    const subFolderIds = await this.backing_.getIdsInPath(trace, this.path, { type: 'folder' });
    if (!subFolderIds.ok) {
      return generalizeFailureResult(trace, subFolderIds, ['not-found', 'wrong-type']);
    }
    const recursivelySwept = await allResultsMapped(trace, subFolderIds.value, {}, async (trace, folderId) => {
      const itemAccessor = this.makeMutableItemAccessor_(this.path.append(folderId), 'folder');
      return await itemAccessor.sweep(trace);
    });
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
    async (
      trace,
      id: SyncableId,
      metadata: SyncableFolderMetadata & LocalItemMetadata
    ): PR<InMemoryAccessControlledFolder, 'conflict' | 'deleted'> => {
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

      const createdFolder = await this.backing_.createFolderWithPath(trace, newPath, { metadata });
      if (!createdFolder.ok) {
        return generalizeFailureResult(trace, createdFolder, ['not-found', 'wrong-type']);
      }

      const folder = new InMemoryAccessControlledFolder({
        store: this.weakStore_,
        backing: this.backing_,
        syncTracker: this.syncTracker_,
        path: newPath
      });

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

  private makeItemAccessor_<T extends SyncableItemType>(path: StaticSyncablePath, itemType: T): SyncableItemAccessor & { type: T } {
    return this.makeMutableItemAccessor_<T>(path, itemType);
  }

  private makeMutableItemAccessor_<T extends SyncableItemType>(
    path: StaticSyncablePath,
    itemType: T
  ): MutableSyncableItemAccessor & { type: T } {
    switch (itemType) {
      case 'folder':
        return this.makeFolderAccessor_({ path }) as any as MutableSyncableItemAccessor & { type: T };

      case 'bundleFile':
        throw new Error("Bundles can't be managed by InMemoryFolder");

      case 'flatFile':
        throw new Error("Flat files can't be managed by InMemoryFolder");
    }
  }
}
