import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { ZERO_UUID } from 'freedom-basic-data';
import { ConflictError } from 'freedom-common-errors';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import { GoogleStorageSyncableStoreBacking } from 'freedom-google-storage-syncable-store-backing';
import { type StorageRootId, type SyncableItemMetadata, uuidId } from 'freedom-sync-types';

import { getFsRootPathForStorageRootId } from '../internal/utils/getFsRootPathForStorageRootId.ts';
import { getFsStatsAtPath } from '../internal/utils/getFsStatsAtPath.ts';
import { getServerSyncableStoreBacking } from './getServerSyncableStoreBacking.ts';

export const createSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      storageRootId,
      metadata
    }: {
      storageRootId: StorageRootId;
      metadata: Omit<SyncableItemMetadata, 'name'>;
    }
  ): PR<undefined, 'conflict'> => {
    const storeBackingResult = await getServerSyncableStoreBacking(trace, storageRootId);
    if (!storeBackingResult.ok) {
      return storeBackingResult;
    }

    // TODO: Move into FileSystemSyncableStoreBacking.initialize()
    if (storeBackingResult.value instanceof FileSystemSyncableStoreBacking) {
      const rootPath = await uncheckedResult(getFsRootPathForStorageRootId(trace, storageRootId));

      // Create the root directory
      const fsStats = await getFsStatsAtPath(trace, rootPath);
      if (!fsStats.ok) {
        return fsStats;
      } else if (fsStats.value.exists) {
        return makeFailure(
          new ConflictError(trace, {
            message: `Path already exists: ${rootPath}`,
            errorCode: 'conflict'
          })
        );
      } else {
        await fs.mkdir(rootPath);
      }

      // Initialize its structure
      const initialized = await storeBackingResult.value.initialize(trace, metadata);
      if (!initialized.ok) {
        return initialized;
      }
    } else if (storeBackingResult.value instanceof GoogleStorageSyncableStoreBacking) {
      // TODO: Put initialize() to SyncableStoreBacking with this signature
      // Initialize its structure
      const initialized = await storeBackingResult.value.initialize(trace, storageRootId, {
        ...metadata,
        // ROOT_FOLDER_ID, it should probably come from freedom-syncable-store.createSyncableStore(backing)
        // TODO: Move this whole createSyncableStore() to freedom-syncable-store
        // TODO: Normalize ROOT_FOLDER_ID
        name: uuidId('folder', ZERO_UUID)
      });
      if (!initialized.ok) {
        return initialized;
      }
    } else {
      // TODO: remove this branch when initialize() is unified
      throw new Error('Should not happen');
    }

    return makeSuccess(undefined);
  }
);
