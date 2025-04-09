import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { addEmail } from 'freedom-email-sync';

import { getOrCreateEmailAccessForUserPure } from './getOrCreateEmailAccessForUserPure.ts';
import { findUserByEmail } from './mockUserDb.ts';
import { makeFailure } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';

export const addIncomingEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, {
    rcpt,
    from,
    to,
    subject,
    body,
    timeMSec
  }: {
    rcpt: string; // user's email
    from: string;
    to: string;
    subject: string;
    body: string;
    timeMSec: number;
  }): PR<undefined> => {
    const userResult = await findUserByEmail(trace, rcpt);
    if (!userResult.ok) {
      return userResult;
    }
    if (!userResult.value) {
      return makeFailure(new NotFoundError(trace, { message: 'Email not found' }));
    }

    const { userId, publicKeys, defaultSalt } = userResult.value;

    const access = await uncheckedResult(getOrCreateEmailAccessForUserPure(trace, {
      userId,
      publicKeys: publicKeys,
      saltsById: { SALT_default: defaultSalt }
    }));

    const added = await addEmail(trace, access, {
      from,
      to,
      subject,
      body,
      timeMSec
    });
    if (!added.ok) {
      return added;
    }

    return makeSuccess(undefined);
  }
);
