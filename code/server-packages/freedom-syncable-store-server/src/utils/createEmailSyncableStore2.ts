import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getSaltsForUser } from 'freedom-db';
import type { EmailUserId } from 'freedom-email-sync';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { createEmailSyncableStore1 } from './createEmailSyncableStore1.ts';
import { getPublicKeysForUser } from './getPublicKeysForUser.ts';

// TODO: TEMP
const globalCache: Record<EmailUserId, MutableSyncableStore> = {};

export const createEmailSyncableStore2 = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<MutableSyncableStore> => {
    const cached = globalCache[userId];
    if (cached !== undefined) {
      return makeSuccess(cached);
    }

    const saltsById = await getSaltsForUser(trace, { userId });
    if (!saltsById.ok) {
      return generalizeFailureResult(trace, saltsById, 'not-found');
    }

    const publicKeys = await getPublicKeysForUser(trace, { userId });
    if (!publicKeys.ok) {
      return generalizeFailureResult(trace, publicKeys, 'not-found');
    }

    const syncableStore = await createEmailSyncableStore1(trace, {
      userId,
      publicKeys: publicKeys.value,
      saltsById: saltsById.value
    });
    if (!syncableStore.ok) {
      return syncableStore;
    }

    globalCache[userId] = syncableStore.value;

    return syncableStore;
  }
);
