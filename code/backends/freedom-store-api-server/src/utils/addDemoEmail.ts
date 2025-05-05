import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';
import { addMail } from 'freedom-email-sync';
import { createEmailSyncableStore2 } from 'freedom-syncable-store-server';

export const addDemoEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    const syncableStore = await uncheckedResult(createEmailSyncableStore2(trace, { userId }));

    const added = await addMail(trace, syncableStore, {
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
