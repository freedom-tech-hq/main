import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { getMailAgentUserKeys } from 'freedom-db';
import type { EmailUserId } from 'freedom-email-sync';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import { type SaltId, storageRootIdInfo } from 'freedom-sync-types';
import { DefaultSyncableStore } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { getFsRootPathForStorageRootId } from '../internal/utils/getFsRootPathForStorageRootId.ts';

export const createEmailSyncableStore1 = makeAsyncResultFunc(
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
  ): PR<MutableSyncableStore> => {
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

    return makeSuccess(userFs);
  }
);
