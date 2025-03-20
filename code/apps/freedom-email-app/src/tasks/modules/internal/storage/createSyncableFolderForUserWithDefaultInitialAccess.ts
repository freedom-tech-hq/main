import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { DynamicSyncableId, SyncablePath } from 'freedom-sync-types';
import type { MutableAccessControlledFolderAccessor } from 'freedom-syncable-store-types';
import { createFolderAtPath } from 'freedom-syncable-store-types';

import type { EmailUserId } from '../../../../types/EmailUserId.ts';
import { getRequiredCryptoKeysForUser } from '../user/getRequiredCryptoKeysForUser.ts';
import { getUserFs } from './getUserFs.ts';

export const createSyncableFolderForUserWithDefaultInitialAccess = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { userId, parentPath, id }: { userId: EmailUserId; parentPath: SyncablePath; id: DynamicSyncableId }
  ): PR<MutableAccessControlledFolderAccessor, 'deleted' | 'conflict' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const cryptoKeys = await getRequiredCryptoKeysForUser(trace, { userId });
    if (!cryptoKeys.ok) {
      return cryptoKeys;
    }

    const userFs = await getUserFs(trace, { userId });
    if (!userFs.ok) {
      return userFs;
    }

    return createFolderAtPath(trace, userFs.value, parentPath, id);
  }
);
