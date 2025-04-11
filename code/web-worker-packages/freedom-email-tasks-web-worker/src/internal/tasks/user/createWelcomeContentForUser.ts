import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { addMail } from 'freedom-email-sync';
import type { EmailCredential } from 'freedom-email-user';

import { getOrCreateEmailAccessForUser } from './getOrCreateEmailAccessForUser.ts';

export const createWelcomeContentForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: EmailCredential): PR<undefined> => {
    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

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
