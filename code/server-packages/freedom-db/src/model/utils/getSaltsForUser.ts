import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';
import type { SaltsById } from 'freedom-sync-types';
import { DEFAULT_SALT_ID } from 'freedom-sync-types';

import { getEmailByUserIdStore } from '../internal/utils/getEmailByUserIdStore.ts';
import { findUserByEmail } from './findUserByEmail.ts';

export const getSaltsForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<SaltsById, 'not-found'> => {
    const emailByUserIdStore = await uncheckedResult(getEmailByUserIdStore(trace));

    const email = await emailByUserIdStore.object(userId).get(trace);
    if (!email.ok) {
      return email;
    }

    const user = await findUserByEmail(trace, email.value);
    if (!user.ok) {
      return user;
    }

    return makeSuccess({ [DEFAULT_SALT_ID]: user.value.defaultSalt });
  }
);
