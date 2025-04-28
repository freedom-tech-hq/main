import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';
import { addMail } from 'freedom-email-sync';
import { getOrCreateEmailAccessForUser } from 'freedom-fake-email-service';

export const addDemoEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, { userId }));

    const added = await addMail(trace, access, {
      from: 'test@freedomtechhq.com',
      to: ['test@freedomtechhq.com'],
      subject: `Test Email (${new Date().toISOString()})`,
      body: 'This is a test email',
      timeMSec: Date.now()
    });
    if (!added.ok) {
      return added;
    }

    return makeSuccess(undefined);
  }
);
