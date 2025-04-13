import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { EmailAccess, EmailUserId } from 'freedom-email-sync';
import type { EmailCredential } from 'freedom-email-user';
import { storageRootIdInfo } from 'freedom-sync-types';
import { DefaultSyncableStore } from 'freedom-syncable-store-types';

import { makeCryptoServiceForUser } from '../../utils/makeCryptoServiceForUser.ts';
import { getOrCreateSyncableStoreBackingForUserEmail } from '../storage/getOrCreateSyncableStoreBackingForUserEmail.ts';

// TODO: TEMP
const globalCache: Record<EmailUserId, EmailAccess> = {};

export const getOrCreateEmailAccessForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: EmailCredential): PR<EmailAccess> => {
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
    const cryptoService = makeCryptoServiceForUser(credential);

    const userFs = new DefaultSyncableStore({
      storageRootId,
      cryptoService,
      saltsById: credential.saltsById,
      creatorPublicKeys: credential.privateKeys.publicOnly(),
      backing: backing.value
    });

    const output: EmailAccess = { userId, cryptoService, saltsById: credential.saltsById, userFs };
    globalCache[userId] = output;

    return makeSuccess(output);
  }
);
