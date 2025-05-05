import { type PR, uncheckedResult } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { getMailAgentUserKeys, type User } from 'freedom-db';
import { DEFAULT_SALT_ID, storageRootIdInfo } from 'freedom-sync-types';
import { getServerSyncableStore } from 'freedom-syncable-store-server';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

export const getEmailAgentSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, user: Pick<User, 'userId' | 'publicKeys' | 'defaultSalt'>): PR<MutableSyncableStore> => {
    // Extract storageRootId
    const storageRootId = storageRootIdInfo.make(user.userId);

    // Agent keys to access user data
    const agentUserKeys = await uncheckedResult(getMailAgentUserKeys(trace));

    // Store, server-style
    return await getServerSyncableStore(trace, {
      storageRootId,
      userKeys: agentUserKeys,
      saltsById: { [DEFAULT_SALT_ID]: user.defaultSalt },
      creatorPublicKeys: user.publicKeys
    });
  }
);
