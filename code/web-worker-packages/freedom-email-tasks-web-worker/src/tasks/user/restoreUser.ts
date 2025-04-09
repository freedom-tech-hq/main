import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { UserAuthPackage } from 'freedom-email-user';

import { useActiveUserId } from '../../contexts/active-user-id.ts';
import { getOrCreateKeyStoreForUser } from '../../internal/tasks/storage/getOrCreateKeyStoreForUser.ts';

/**
 * Restores a user from known information, including the user ID and private keys.
 */
export const restoreUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId, privateKeys }: UserAuthPackage): PR<undefined> => {
    const activeUserId = useActiveUserId(trace);

    const keyStore = await getOrCreateKeyStoreForUser(trace, { userId });
    if (!keyStore.ok) {
      return keyStore;
    }

    const secretAccessor = keyStore.value.mutableObject(privateKeys.id);

    const storedSecret = await secretAccessor.create(trace, privateKeys);
    if (!storedSecret.ok) {
      // Conflicts won't happen here since the IDs are UUID based
      return generalizeFailureResult(trace, storedSecret, 'conflict');
    }

    activeUserId.userId = userId;

    return makeSuccess(undefined);
  }
);
