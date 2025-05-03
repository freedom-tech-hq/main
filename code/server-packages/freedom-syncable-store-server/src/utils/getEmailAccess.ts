import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import type { EmailAccess, EmailUserId } from 'freedom-email-sync';
import { getCryptoService, getSyncableStoreBackingForUserEmail } from 'freedom-fake-email-service';
import { type SaltId, storageRootIdInfo } from 'freedom-sync-types';
import { DefaultSyncableStore } from 'freedom-syncable-store';

export const getEmailAccess = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      userId,
      publicKeys,
      saltsById
    }: {
      userId: EmailUserId;
      publicKeys: CombinationCryptoKeySet;
      saltsById: Partial<Record<SaltId, string>>;
    }
  ): PR<EmailAccess> => {
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
