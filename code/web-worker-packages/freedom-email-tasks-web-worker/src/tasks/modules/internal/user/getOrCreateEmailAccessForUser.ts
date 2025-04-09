import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { EmailAccess, EmailUserId } from 'freedom-email-sync';
import { storageRootIdInfo } from 'freedom-sync-types';
import { DefaultSyncableStore } from 'freedom-syncable-store-types';

import { getOrCreateEmailAppSaltsForUser } from '../../../../internal/tasks/storage/getOrCreateEmailAppSaltsForUser.ts';
import { getOrCreateSyncableStoreBackingForUserEmail } from '../../../../internal/tasks/storage/getOrCreateSyncableStoreBackingForUserEmail.ts';
import { makeCryptoServiceForUser } from '../../../../internal/utils/makeCryptoServiceForUser.ts';
import { getRequiredPrivateKeysForUser } from './getRequiredPrivateKeysForUser.ts';

// TODO: TEMP
const globalCache: Record<EmailUserId, EmailAccess> = {};

export const getOrCreateEmailAccessForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<EmailAccess> => {
    const cached = globalCache[userId];
    if (cached !== undefined) {
      return makeSuccess(cached);
    }

    const saltsById = await getOrCreateEmailAppSaltsForUser(trace, { userId });
    if (!saltsById.ok) {
      return saltsById;
    }

    const privateKeys = await getRequiredPrivateKeysForUser(trace, { userId });
    if (!privateKeys.ok) {
      return privateKeys;
    }

    const backing = await getOrCreateSyncableStoreBackingForUserEmail(trace, { userId });
    if (!backing.ok) {
      return backing;
    }

    const storageRootId = storageRootIdInfo.make(userId);
    const cryptoService = makeCryptoServiceForUser({ userId });

    const userFs = new DefaultSyncableStore({
      storageRootId,
      cryptoService,
      saltsById: saltsById.value,
      creatorPublicKeys: privateKeys.value.publicOnly(),
      backing: backing.value
    });

    const output: EmailAccess = { userId, cryptoService, saltsById: saltsById.value, userFs };
    globalCache[userId] = output;

    return makeSuccess(output);
  }
);
