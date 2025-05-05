import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { addMail } from 'freedom-email-sync';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

export const createWelcomeContentForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore): PR<undefined> => {
    const emailAdded = await addMail(trace, syncableStore, {
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
