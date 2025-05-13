import { type PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { User } from 'freedom-db';
import { DEFAULT_SALT_ID, storageRootIdInfo } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { getEmailAgentSyncableStore } from './getEmailAgentSyncableStore.ts';

export const getEmailAgentSyncableStoreForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, user: User): PR<MutableSyncableStore> => {
    const storageRootId = storageRootIdInfo.make(user.userId);
    const creatorPublicKeys = user.publicKeys;
    const saltsById = { [DEFAULT_SALT_ID]: user.defaultSalt };

    // Store, server-style
    return await getEmailAgentSyncableStore(trace, { storageRootId, creatorPublicKeys, saltsById });
  }
);
