import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import { createGoogleStorageSyncableStoreBacking } from 'freedom-google-storage-syncable-store-backing';
import type { StorageRootId } from 'freedom-sync-types';
import type { DefaultSyncableStoreConstructorArgs } from 'freedom-syncable-store/lib/types/DefaultSyncableStore';
import type { SyncableStoreBacking } from 'freedom-syncable-store-backing-types';

import { getConfig } from '../config.ts';
import { getFsRootPathForStorageRootId } from '../internal/utils/getFsRootPathForStorageRootId.ts';

export type GetServerSyncableStoreArgs = Omit<DefaultSyncableStoreConstructorArgs, 'backing'>;

let singletonBacking: SyncableStoreBacking | undefined;

/**
 * Translates configuration into a SyncableStoreBacking instance
 */
export const getServerSyncableStoreBacking = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, storageRootId: StorageRootId): PR<SyncableStoreBacking> => {
    // Google Storage
    const GOOGLE_APPLICATION_CREDENTIALS = getConfig('GOOGLE_APPLICATION_CREDENTIALS');
    const GOOGLE_STORAGE_BUCKET = getConfig('GOOGLE_STORAGE_BUCKET');
    if (GOOGLE_APPLICATION_CREDENTIALS !== undefined && GOOGLE_STORAGE_BUCKET !== undefined) {
      if (singletonBacking === undefined) {
        singletonBacking = createGoogleStorageSyncableStoreBacking({
          credentials: GOOGLE_APPLICATION_CREDENTIALS,
          bucketName: GOOGLE_STORAGE_BUCKET
        });
      }

      return makeSuccess(singletonBacking);
    }

    // File System
    const rootPath = await uncheckedResult(getFsRootPathForStorageRootId(trace, storageRootId));
    const backing = new FileSystemSyncableStoreBacking(rootPath);

    return makeSuccess(backing);
  }
);
