import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { EmailAccess, EmailUserId } from 'freedom-email-sync';
import { type SaltId, storageRootIdInfo } from 'freedom-sync-types';
import { DefaultSyncableStore } from 'freedom-syncable-store-types';

import { getCryptoService } from './getCryptoService.ts';
import { getSyncableStoreBackingForUserEmail } from './getSyncableStoreBackingForUserEmail.ts';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';

export const getOrCreateEmailAccessForUserPure = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, {
    userId,
    publicKeys,
    saltsById,
  }: {
    userId: EmailUserId;
    publicKeys: CombinationCryptoKeySet;
    saltsById: Partial<Record<SaltId, string>>;
  }): PR<EmailAccess> => {
    const cryptoService = await uncheckedResult(getCryptoService(trace));

    const backing = await getSyncableStoreBackingForUserEmail(trace, { userId });
    if (!backing.ok) {
      return backing;
    }

    const storageRootId = storageRootIdInfo.make(userId);

    const userFs = new DefaultSyncableStore({
      storageRootId,
      cryptoService,
      saltsById: saltsById,
      creatorPublicKeys: publicKeys,
      backing: backing.value
    });

    const output: EmailAccess = { userId, cryptoService, saltsById: saltsById, userFs };

    return makeSuccess(output);
  }
);
