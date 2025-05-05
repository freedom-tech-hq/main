import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';

import { getEmailByUserIdStore } from '../internal/utils/getEmailByUserIdStore.ts';
import type { User } from '../types/exports.ts';
import { findUserByEmail } from './findUserByEmail.ts';

export const getUserById = makeAsyncResultFunc([import.meta.filename], async (trace, userId: EmailUserId): PR<User, 'not-found'> => {
  const emailByUserIdStore = await uncheckedResult(getEmailByUserIdStore(trace));

  const email = await emailByUserIdStore.object(userId).get(trace);
  if (!email.ok) {
    return email;
  }

  const user = await findUserByEmail(trace, email.value);
  if (!user.ok) {
    return user;
  }

  return makeSuccess(user.value);
});
