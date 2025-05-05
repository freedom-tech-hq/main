import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';
import type { EmailCredential } from 'freedom-email-user';
import { storageRootIdInfo } from 'freedom-sync-types';
import { DefaultSyncableStore } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { makeUserKeysFromEmailCredential } from '../../utils/makeUserKeysFromEmailCredential.ts';
import { getOrCreateSyncableStoreBackingForUserEmail } from '../storage/getOrCreateSyncableStoreBackingForUserEmail.ts';

// TODO: TEMP
const globalCache: Record<EmailUserId, MutableSyncableStore> = {};

export const getOrCreateEmailSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: EmailCredential): PR<MutableSyncableStore> => {
    const userId = credential.userId;

    const cached = globalCache[userId];
    if (cached !== undefined) {
      return makeSuccess(cached);
    }

    const backing = await getOrCreateSyncableStoreBackingForUserEmail(trace, credential);
    if (!backing.ok) {
      return backing;
    }

    const storageRootId = storageRootIdInfo.make(userId);
    const userKeys = makeUserKeysFromEmailCredential(credential);

    const syncableStore = new DefaultSyncableStore({
      storageRootId,
      userKeys,
      saltsById: credential.saltsById,
      creatorPublicKeys: credential.privateKeys.publicOnly(),
      backing: backing.value
    });

    globalCache[userId] = syncableStore;

    return makeSuccess(syncableStore);
  }
);
