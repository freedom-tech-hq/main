import { allResultsNamed, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';
import { EMAIL_APP_SALT_ID } from 'freedom-email-user';
import { DEFAULT_SALT_ID } from 'freedom-sync-types';

import { getOrCreateSalt } from './getOrCreateSalt.ts';
import { getOrCreateSaltStoreForUser } from './getOrCreateSaltStoreForUser.ts';

export const getOrCreateEmailAppSaltsForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }) => {
    const saltStore = await uncheckedResult(getOrCreateSaltStoreForUser(trace, { userId }));

    const salts = await allResultsNamed(
      trace,
      {},
      {
        [DEFAULT_SALT_ID]: getOrCreateSalt(trace, saltStore, DEFAULT_SALT_ID),
        [EMAIL_APP_SALT_ID]: getOrCreateSalt(trace, saltStore, EMAIL_APP_SALT_ID)
      }
    );
    if (!salts.ok) {
      return salts;
    }

    return makeSuccess(salts.value);
  }
);
