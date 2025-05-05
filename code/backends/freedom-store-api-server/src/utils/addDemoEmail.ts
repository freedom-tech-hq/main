import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { getUserById } from 'freedom-db';
import { getEmailAgentSyncableStore } from 'freedom-email-server';
import type { EmailUserId } from 'freedom-email-sync';
import { addMail } from 'freedom-email-sync';

export const addDemoEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    // Get store
    const user = await uncheckedResult(getUserById(trace, userId));
    const syncableStore = await uncheckedResult(getEmailAgentSyncableStore(trace, user));

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
