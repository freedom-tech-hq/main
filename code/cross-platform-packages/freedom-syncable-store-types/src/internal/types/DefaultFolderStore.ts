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
import { generateSha256HashForEmptyString, generateSha256HashFromHashesById } from 'freedom-crypto';
import {
  extractSyncableIdParts,
  type SyncableId,
  type SyncableItemMetadata,
  type SyncableItemType,
  type SyncablePath,
  uuidId
} from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import { flatten } from 'lodash-es';
import type { SingleOrArray } from 'yaschema';

import type { SyncableStoreBacking } from '../../types/backing/SyncableStoreBacking.ts';
import type { FolderManagement } from '../../types/FolderManagement.ts';
import type { GenerateNewSyncableItemNameFunc } from '../../types/GenerateNewSyncableItemNameFunc.ts';
import type { LocalItemMetadata } from '../../types/LocalItemMetadata.ts';
import type { MutableFolderStore } from '../../types/MutableFolderStore.ts';
import type { MutableSyncableFolderAccessor } from '../../types/MutableSyncableFolderAccessor.ts';
import type { MutableSyncableItemAccessor } from '../../types/MutableSyncableItemAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SyncableItemAccessor } from '../../types/SyncableItemAccessor.ts';
import type { SyncTracker } from '../../types/SyncTracker.ts';
import { generateProvenanceForFolderLikeItemAtPath } from '../../utils/generateProvenanceForFolderLikeItemAtPath.ts';
import { guardIsExpectedType } from '../../utils/guards/guardIsExpectedType.ts';
import { markSyncableNeedsRecomputeHashAtPath } from '../../utils/markSyncableNeedsRecomputeHashAtPath.ts';
import { intersectSyncableItemTypes } from '../utils/intersectSyncableItemTypes.ts';
import { DefaultMutableSyncableFolderAccessor } from './DefaultMutableSyncableFolderAccessor.ts';
import type { FolderOperationsHandler } from './FolderOperationsHandler.ts';

export class DefaultFolderStore implements Partial<MutableFolderStore>, FolderManagement {
  public readonly type = 'folder';
  public readonly path: SyncablePath;

  private readonly syncTracker_: SyncTracker;

  private readonly weakStore_: WeakRef<MutableSyncableStore>;
  private readonly folderOperationsHandler_: FolderOperationsHandler;
  private readonly makeFolderAccessor_: (args: { path: SyncablePath }) => MutableSyncableFolderAccessor;

  private readonly backing_: SyncableStoreBacking;

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
    path: SyncablePath;
    makeFolderAccessor: (args: { path: SyncablePath }) => MutableSyncableFolderAccessor;
  }) {
    this.weakStore_ = store;
    this.backing_ = backing;
    this.syncTracker_ = syncTracker;
    this.folderOperationsHandler_ = folderOperationsHandler;
    this.path = path;
    this.makeFolderAccessor_ = makeFolderAccessor;
  }

  // MutableFolderStore Methods (partially implemented)

  public readonly createFolder: MutableFolderStore['createFolder'] = makeAsyncResultFunc(
    [import.meta.filename, 'createFolder'],
    async (trace, args): PR<MutableSyncableFolderAccessor, 'conflict' | 'deleted'> => {
      switch (args.mode) {
        case 'via-sync':
          return await this.createPreEncodedFolder_(trace, args.id, args.metadata);
        case undefined:
        case 'local': {
          const store = this.weakStore_.deref();
          if (store === undefined) {
            return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
          }

          const id = args.id ?? uuidId('folder');
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
            type: 'folder',
            name: name.value
          });
          if (!provenance.ok) {
            return provenance;
          }

          const folder = await this.createPreEncodedFolder_(trace, id, { name: name.value, provenance: provenance.value });
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
    async (trace, id: SyncableId): PR<undefined, 'not-found'> => {
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
    ): PR<MutableSyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'wrong-type'> => {
      const getPath = this.path.append(id);

      const idParts = extractSyncableIdParts(id);

      const guards = await allResults(trace, [
        this.guardNotDeleted_(trace, getPath, 'deleted'),
        guardIsExpectedType(trace, getPath, idParts, intersectSyncableItemTypes(expectedType, 'folder'), 'wrong-type')
      ]);
      if (!guards.ok) {
        return guards;
      }

      return makeSuccess(this.makeMutableItemAccessor_<T>(getPath, idParts.type as T));
    }
  );

  public readonly generateNewSyncableItemName: GenerateNewSyncableItemNameFunc = (trace, args) =>
    this.folderOperationsHandler_.generateNewSyncableItemName(trace, args);

  // FolderStore Methods

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
        const updatedMetadata = await this.backing_.updateLocalMetadataAtPath(trace, this.path, { hash: hash.value });
        if (!updatedMetadata.ok) {
          return generalizeFailureResult(trace, updatedMetadata, ['not-found', 'wrong-type']);
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

          const idParts = extractSyncableIdParts(itemId);
          const itemAccessor = this.makeItemAccessor_(getPath, idParts.type);

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
      id: SyncableId,
      expectedType?: SingleOrArray<T>
    ): PR<SyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'wrong-type'> => await this.getMutable(trace, id, expectedType)
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
    const metadataById = await this.getMetadataById(trace);
    if (!metadataById.ok) {
      return metadataById;
    }

    const recursiveLs = await allResultsMapped(
      trace,
      objectEntries(metadataById.value).sort((a, b) => a[0].localeCompare(b[0])),
      {},
      async (trace, [itemId, metadata]): PR<string[]> => {
        if (metadata === undefined) {
          return makeSuccess([]);
        }

        const itemPath = this.path.append(itemId);

        const dynamicName = await this.folderOperationsHandler_.getDynamicName(trace, metadata.name);

        const output: string[] = [`${itemId}${dynamicName.ok ? ` (${JSON.stringify(dynamicName.value)})` : ''}: ${metadata.hash}`];
        const idParts = extractSyncableIdParts(itemId);
        switch (idParts.type) {
          case 'folder': {
            const itemAccessor = this.makeItemAccessor_(itemPath, idParts.type);
            const fileLs = await itemAccessor.ls(trace);
            if (!fileLs.ok) {
              return fileLs;
            }
            // Indenting
            output.push(...fileLs.value.map((value) => `  ${value}`));

            break;
          }
          case 'bundle':
          case 'file':
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
      metadata: SyncableItemMetadata & LocalItemMetadata
    ): PR<DefaultMutableSyncableFolderAccessor, 'conflict' | 'deleted'> => {
      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

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

      const folder = new DefaultMutableSyncableFolderAccessor({
        store,
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
    async <ErrorCodeT extends string>(trace: Trace, path: SyncablePath, errorCode: ErrorCodeT): PR<undefined, ErrorCodeT> => {
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
        return this.makeFolderAccessor_({ path }) as any as MutableSyncableItemAccessor & { type: T };

      case 'bundle':
        throw new Error("Bundles can't be managed by DefaultFolderStore");

      case 'file':
        throw new Error("Files can't be managed by DefaultFolderStore");
    }
  }
}
