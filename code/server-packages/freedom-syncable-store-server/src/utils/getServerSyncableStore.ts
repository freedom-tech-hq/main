import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import { DefaultSyncableStore } from 'freedom-syncable-store';
import type { DefaultSyncableStoreConstructorArgs } from 'freedom-syncable-store/lib/types/DefaultSyncableStore';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { getFsRootPathForStorageRootId } from '../internal/utils/getFsRootPathForStorageRootId.ts';

export type GetServerSyncableStoreArgs = Omit<DefaultSyncableStoreConstructorArgs, 'backing'>;

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

    // Store
    const syncableStore = new DefaultSyncableStore({
      ...options,
      backing: backing
      // metadataLockStore // TODO: hook this up
    });

    return makeSuccess(syncableStore);
  }
);
