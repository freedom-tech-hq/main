import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ConflictError, generalizeFailureResult, InternalStateError, NotFoundError } from 'freedom-common-errors';
import { generateSha256HashForEmptyString, generateSha256HashFromHashesById } from 'freedom-crypto';
import { withAcquiredLock } from 'freedom-locking-types';
import type { SyncableId, SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import { uuidId } from 'freedom-sync-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';
import type {
  MutableFolderStore,
  MutableSyncableBundleAccessor,
  MutableSyncableFileAccessor,
  MutableSyncableFolderAccessor
} from 'freedom-syncable-store-types';

import { generateProvenanceForFolderLikeItemAtPath } from '../../utils/generateProvenanceForFolderLikeItemAtPath.ts';
import { isSyncableDeleted } from '../../utils/isSyncableDeleted.ts';
import { markSyncableNeedsRecomputeLocalMetadataAtPath } from '../utils/markSyncableNeedsRecomputeLocalMetadataAtPath.ts';
import type { DefaultMutableSyncableFolderAccessor } from './DefaultMutableSyncableFolderAccessor.ts';
import { getOrCreateDefaultMutableSyncableFolderAccessor } from './DefaultMutableSyncableFolderAccessor.ts';
import type { DefaultStoreBaseConstructorArgs } from './DefaultStoreBase.ts';
import { DefaultStoreBase } from './DefaultStoreBase.ts';

export interface DefaultFolderStoreConstructorArgs extends Omit<DefaultStoreBaseConstructorArgs, 'supportedItemTypes'> {
  makeFolderAccessor: (args: { path: SyncablePath }) => MutableSyncableFolderAccessor;
}

export class DefaultFolderStore extends DefaultStoreBase implements MutableFolderStore {
  constructor({ makeFolderAccessor, ...args }: DefaultFolderStoreConstructorArgs) {
    super({ ...args, supportedItemTypes: 'folder' });

    this.makeFolderAccessor_ = makeFolderAccessor;
  }

  // Public Methods

  public toString() {
    return `DefaultFolderStore(${this.path_.toString()})`;
  }

  // Abstract MutableFileStore Method Overrides

  protected readonly makeFolderAccessor_: (args: { path: SyncablePath }) => MutableSyncableFolderAccessor;

  protected makeBundleAccessor_(_args: { path: SyncablePath }): MutableSyncableBundleAccessor {
    throw new Error("makeBundleAccessor_ isn't supported by DefaultFolderStore");
  }

  protected makeFileAccessor_(_args: { path: SyncablePath }): MutableSyncableFileAccessor {
    throw new Error("makeFileAccessor_ isn't supported by DefaultFolderStore");
  }

  // MutableFolderStore Methods (partially implemented)

  public readonly createFolder: MutableFolderStore['createFolder'] = makeAsyncResultFunc(
    [import.meta.filename, 'createFolder'],
    async (trace, args): PR<MutableSyncableFolderAccessor, 'conflict' | 'deleted'> => {
      switch (args.mode) {
        case 'via-sync':
          return await this.createPreEncodedFolder_(trace, args.id, args.metadata, { viaSync: true });
        case undefined:
        case 'local': {
          const store = this.weakStore_.deref();
          if (store === undefined) {
            return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
          }

          const id = args.id ?? uuidId('folder');
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
            type: 'folder',
            name: name.value,
            trustedTimeSignature: args.trustedTimeSignature
          });
          if (!provenance.ok) {
            return provenance;
          }

          const folder = await this.createPreEncodedFolder_(
            trace,
            id,
            { name: name.value, provenance: provenance.value },
            { viaSync: false }
          );
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

  // Private Methods

  private readonly createPreEncodedFolder_ = makeAsyncResultFunc(
    [import.meta.filename, 'createPreEncodedFolder_'],
    async (
      trace,
      id: SyncableId,
      metadata: SyncableItemMetadata,
      { viaSync }: { viaSync: boolean }
    ): PR<DefaultMutableSyncableFolderAccessor, 'conflict'> => {
      const newPath = this.path_.append(id);

      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      DEV: store.devLogging.appendLogEntry?.({ type: 'create-folder', pathString: newPath.toString() });

      const hash = await generateSha256HashFromHashesById(trace, {});
      /* node:coverage disable */
      if (!hash.ok) {
        return hash;
      }
      /* node:coverage enable */

      const backingMetadata: SyncableStoreBackingItemMetadata = { ...metadata, hash: hash.value, numDescendants: 0, sizeBytes: 0 };

      const itemAccessor = await withAcquiredLock(
        trace,
        store.lockStore.lock(store.uid),
        {},
        async (trace): PR<DefaultMutableSyncableFolderAccessor, 'conflict'> => {
          const exists = await this.backing_.existsAtPath(trace, newPath);
          if (!exists.ok) {
            return exists;
          } else if (exists.value) {
            return makeFailure(new ConflictError(trace, { message: `${newPath.toString()} already exists`, errorCode: 'conflict' }));
          }

          const createdFolder = await this.backing_.createFolderWithPath(trace, newPath, { metadata: backingMetadata });
          if (!createdFolder.ok) {
            return generalizeFailureResult(trace, createdFolder, ['not-found', 'wrong-type']);
          }

          const parentPath = newPath.parentPath;
          if (parentPath !== undefined) {
            const marked = await markSyncableNeedsRecomputeLocalMetadataAtPath(trace, store, parentPath);
            /* node:coverage disable */
            if (!marked.ok) {
              return generalizeFailureResult(trace, marked, ['not-found', 'untrusted', 'wrong-type']);
            }
            /* node:coverage enable */
          }

          return makeSuccess(
            getOrCreateDefaultMutableSyncableFolderAccessor({
              store,
              backing: this.backing_,
              path: newPath,
              syncTracker: this.syncTracker_
            })
          );
        }
      );
      if (!itemAccessor.ok) {
        return generalizeFailureResult(trace, itemAccessor, 'lock-timeout');
      }

      DEV: debugTopic('SYNC', (log) => log(trace, `Notifying folderAdded for folder ${newPath.toShortString()}`));
      this.syncTracker_.notify('folderAdded', { path: newPath, viaSync });

      DEV: debugTopic('SYNC', (log) => log(trace, `Notifying itemAdded for folder ${newPath.toShortString()}`));
      this.syncTracker_.notify('itemAdded', { path: newPath, hash: hash.value, viaSync });

      return makeSuccess(itemAccessor.value);
    }
  );
}
