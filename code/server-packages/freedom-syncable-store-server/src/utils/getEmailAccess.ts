import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import type { EmailAccess, EmailUserId } from 'freedom-email-sync';
import { getCryptoService, getFsRootPathForStorageRootId } from 'freedom-fake-email-service';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
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

    const storageRootId = storageRootIdInfo.make(userId);

    const rootPath = await uncheckedResult(getFsRootPathForStorageRootId(trace, storageRootId));

    const backing = new FileSystemSyncableStoreBacking(rootPath);

    const userFs = new DefaultSyncableStore({
      storageRootId,
      cryptoService,
      saltsById: saltsById,
      creatorPublicKeys: publicKeys,
      backing: backing
    });

    const output: EmailAccess = { userId, cryptoService, saltsById: saltsById, userFs };

    return makeSuccess(output);
  }
);
