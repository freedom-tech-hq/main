import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';
import { DEFAULT_SALT_ID } from 'freedom-sync-types';

import { getOrCreateSaltStoreForUser } from './getOrCreateSaltStoreForUser.ts';
import { getSalt } from './getSalt.ts';

export const getSaltsForUser = makeAsyncResultFunc([import.meta.filename], async (trace, { userId }: { userId: EmailUserId }) => {
  const saltStore = await uncheckedResult(getOrCreateSaltStoreForUser(trace, { userId }));

  const salt = await getSalt(trace, saltStore, DEFAULT_SALT_ID);
  if (!salt.ok) {
    return salt;
  }

  return makeSuccess({ [DEFAULT_SALT_ID]: salt.value });
});
