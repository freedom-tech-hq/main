import { type PR, uncheckedResult } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { getMailAgentUserKeys } from 'freedom-db';
import type { SaltsById, StorageRootId } from 'freedom-sync-types';
import { getServerSyncableStore } from 'freedom-syncable-store-server';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

export const getEmailAgentSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      storageRootId,
      creatorPublicKeys,
      saltsById
    }: { storageRootId: StorageRootId; creatorPublicKeys: CombinationCryptoKeySet; saltsById: SaltsById }
    //  user: Pick<User, 'userId' | 'publicKeys' | 'defaultSalt'>
  ): PR<MutableSyncableStore> => {
    // Agent keys to access user data
    const agentUserKeys = await uncheckedResult(getMailAgentUserKeys(trace));

    // Store, server-style
    return await getServerSyncableStore(trace, { storageRootId, userKeys: agentUserKeys, saltsById, creatorPublicKeys });
  }
);
