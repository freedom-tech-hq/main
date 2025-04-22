import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailAccess, EmailUserId } from 'freedom-email-sync';
import { storageRootIdInfo } from 'freedom-sync-types';
import { DefaultSyncableStore } from 'freedom-syncable-store';

import { getCryptoService } from './getCryptoService.ts';
import { getPublicKeysForUser } from './getPublicKeysForUser.ts';
import { getSaltsForUser } from './getSaltsForUser.ts';
import { getSyncableStoreBackingForUserEmail } from './getSyncableStoreBackingForUserEmail.ts';

// TODO: TEMP
const globalCache: Record<EmailUserId, EmailAccess> = {};

export const getOrCreateEmailAccessForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<EmailAccess> => {
    const cached = globalCache[userId];
    if (cached !== undefined) {
      return makeSuccess(cached);
    }

    const cryptoService = await uncheckedResult(getCryptoService(trace));

    const saltsById = await getSaltsForUser(trace, { userId });
    if (!saltsById.ok) {
      return generalizeFailureResult(trace, saltsById, 'not-found');
    }

    const publicKeys = await getPublicKeysForUser(trace, { userId });
    if (!publicKeys.ok) {
      return generalizeFailureResult(trace, publicKeys, 'not-found');
    }

    const backing = await getSyncableStoreBackingForUserEmail(trace, { userId });
    if (!backing.ok) {
      return backing;
    }

    const storageRootId = storageRootIdInfo.make(userId);

    const userFs = new DefaultSyncableStore({
      storageRootId,
      cryptoService,
      saltsById: saltsById.value,
      creatorPublicKeys: publicKeys.value,
      backing: backing.value
    });

    const output: EmailAccess = { userId, cryptoService, saltsById: saltsById.value, userFs };
    globalCache[userId] = output;

    return makeSuccess(output);
  }
);
