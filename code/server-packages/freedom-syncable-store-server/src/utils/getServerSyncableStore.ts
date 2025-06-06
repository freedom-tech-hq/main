import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { LockStore } from 'freedom-locking-types';
import { createRedlockStore } from 'freedom-redlock-store';
import type { DefaultSyncableStoreConstructorArgs } from 'freedom-syncable-store';
import { DefaultSyncableStore } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { getConfig } from '../config.ts';
import { getServerSyncableStoreBacking } from './getServerSyncableStoreBacking.ts';

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
    const backingResult = await getServerSyncableStoreBacking(trace, options.storageRootId);
    if (!backingResult.ok) {
      return backingResult;
    }

    // Lock store
    if (lockStore === undefined) {
      const lockStoreResult = await createRedlockStore(trace, {
        host: getConfig('REDIS_HOST'),
        port: getConfig('REDIS_PORT'),
        password: getConfig('REDIS_PASSWORD'),
        prefix: getConfig('REDIS_PREFIX') + 'store_lock:'
      });
      if (!lockStoreResult.ok) {
        return lockStoreResult;
      }
      lockStore = lockStoreResult.value;
    }

    // Store
    const syncableStore = new DefaultSyncableStore({
      ...options,
      backing: backingResult.value,
      lockStore: lockStore
    });

    return makeSuccess(syncableStore);
  }
);
