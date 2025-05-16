import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import type { LockStore } from 'freedom-locking-types';
import { createRedlockStore } from 'freedom-redlock-store';
import { DefaultSyncableStore } from 'freedom-syncable-store';
import type { DefaultSyncableStoreConstructorArgs } from 'freedom-syncable-store/lib/types/DefaultSyncableStore';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { getConfig } from '../config.ts';
import { getFsRootPathForStorageRootId } from '../internal/utils/getFsRootPathForStorageRootId.ts';

export type GetServerSyncableStoreArgs = Omit<DefaultSyncableStoreConstructorArgs, 'backing'>;

let lockStore: LockStore<string> | undefined;

/**
 * Creates a syncable store for an agent to access user data.
 *
 * Important:
 *   options.userKeys - agent keys to write to the shared folders
 *   options.creatorPublicKeys - user's (data owner's) public keys
 */
export const getServerSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, options: GetServerSyncableStoreArgs): PR<MutableSyncableStore> => {
    // Backing
    const rootPath = await uncheckedResult(getFsRootPathForStorageRootId(trace, options.storageRootId));
    const backing = new FileSystemSyncableStoreBacking(rootPath);

    // Lock store
    if (lockStore === undefined) {
      const lockStoreResult = await createRedlockStore(trace, {
        host: getConfig('REDIS_HOST'),
        port: getConfig('REDIS_PORT'),
        password: getConfig('REDIS_PASSWORD'),
        prefix: getConfig('REDIS_LOCK_STORE_PREFIX')
      });
      if (!lockStoreResult.ok) {
        return lockStoreResult;
      }
      lockStore = lockStoreResult.value;
    }

    // Store
    const syncableStore = new DefaultSyncableStore({
      ...options,
      backing: backing,
      metadataLockStore: lockStore
    });

    return makeSuccess(syncableStore);
  }
);
