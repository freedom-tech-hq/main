import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getSaltsForUser } from 'freedom-db';
import type { EmailAccess, EmailUserId } from 'freedom-email-sync';

import { getEmailAccess } from './getEmailAccess.ts';
import { getPublicKeysForUser } from './getPublicKeysForUser.ts';

// TODO: TEMP
const globalCache: Record<EmailUserId, EmailAccess> = {};

export const getEmailAccessByUserId = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<EmailAccess> => {
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

    const access = await getEmailAccess(trace, {
      userId,
      publicKeys: publicKeys.value,
      saltsById: saltsById.value
    });
    if (!access.ok) {
      return access;
    }

    globalCache[userId] = access.value;

    return access;
  }
);
