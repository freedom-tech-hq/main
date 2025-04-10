import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { addMail, type EmailUserId } from 'freedom-email-sync';

import { getOrCreateEmailAccessForUser } from './getOrCreateEmailAccessForUser.ts';

export const createWelcomeContentForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, { userId }));

    const emailAdded = await addMail(trace, access, {
      from: 'test@freedomtechhq.com',
      to: ['test@freedomtechhq.com'],
      subject: 'Welcome to Freedom!',
      body: 'This is a test email',
      timeMSec: Date.now()
    });
    if (!emailAdded.ok) {
      return emailAdded;
    }

    return makeSuccess(undefined);
  }
);
