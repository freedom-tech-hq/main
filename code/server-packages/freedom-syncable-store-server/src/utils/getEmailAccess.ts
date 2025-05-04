import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { getMailAgentUserKeys } from 'freedom-db';
import type { EmailAccess, EmailUserId } from 'freedom-email-sync';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import { type SaltId, storageRootIdInfo } from 'freedom-sync-types';
import { DefaultSyncableStore } from 'freedom-syncable-store';

import { getFsRootPathForStorageRootId } from '../internal/utils/getFsRootPathForStorageRootId.ts';

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
    const agentUserKeys = await uncheckedResult(getMailAgentUserKeys(trace));

    const storageRootId = storageRootIdInfo.make(userId);

    const rootPath = await uncheckedResult(getFsRootPathForStorageRootId(trace, storageRootId));

    const backing = new FileSystemSyncableStoreBacking(rootPath);

    const userFs = new DefaultSyncableStore({
      storageRootId,
      userKeys: agentUserKeys,
      saltsById: saltsById,
      creatorPublicKeys: publicKeys,
      backing: backing
    });

    const output: EmailAccess = { userId, userKeys: agentUserKeys, saltsById: saltsById, userFs };

    return makeSuccess(output);
  }
);
