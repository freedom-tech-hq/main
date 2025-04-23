import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { addMail } from 'freedom-email-sync';

import { findUserByEmail } from './findUserByEmail.ts';
import { getOrCreateEmailAccessForUserPure } from './getOrCreateEmailAccessForUserPure.ts';

export const addIncomingEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
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
    }
  ): PR<undefined> => {
    const userResult = await findUserByEmail(trace, rcpt);
    if (!userResult.ok) {
      return generalizeFailureResult(trace, userResult, 'not-found');
    }

    const { userId, publicKeys, defaultSalt } = userResult.value;

    const access = await uncheckedResult(
      getOrCreateEmailAccessForUserPure(trace, {
        userId,
        publicKeys: publicKeys,
        saltsById: { SALT_default: defaultSalt }
      })
    );

    const added = await addMail(trace, access, {
      from,
      to: [to],
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
