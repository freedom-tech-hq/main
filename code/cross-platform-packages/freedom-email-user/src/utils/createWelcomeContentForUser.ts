import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { EmailAccess } from 'freedom-email-sync';
import { addMail } from 'freedom-email-sync';

export const createWelcomeContentForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess): PR<undefined> => {
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
