import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import type { StorageRootId, SyncableItemMetadata } from 'freedom-sync-types';

import { getFsRootPathForStorageRootId } from '../internal/utils/getFsRootPathForStorageRootId.ts';
import { getFsStatsAtPath } from '../internal/utils/getFsStatsAtPath.ts';

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
    const rootPath = await uncheckedResult(getFsRootPathForStorageRootId(trace, storageRootId));

    // Create the root directory
    const fsStats = await getFsStatsAtPath(trace, rootPath);
    if (!fsStats.ok) {
      return fsStats;
    } else if (fsStats.value.exists) {
      return makeFailure(new ConflictError(trace, { message: `Path already exists: ${rootPath}`, errorCode: 'conflict' }));
    } else {
      await fs.mkdir(rootPath);
    }

    // Initialize its structure
    const storeBacking = new FileSystemSyncableStoreBacking(rootPath);
    const initialized = await storeBacking.initialize(trace, metadata);
    if (!initialized.ok) {
      return initialized;
    }

    return makeSuccess(undefined);
  }
);
