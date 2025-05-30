import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getUserById } from 'freedom-db';
import { getEmailAgentSyncableStoreForUser } from 'freedom-email-server';
import type { EmailUserId } from 'freedom-email-sync';
import { addMail } from 'freedom-email-sync';

export const addDemoEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    // Get store
    const user = await getUserById(trace, userId);
    if (!user.ok) {
      return generalizeFailureResult(trace, user, 'not-found', `User with ID ${userId} not found`);
    }

    const syncableStore = await getEmailAgentSyncableStoreForUser(trace, user.value);
    if (!syncableStore.ok) {
      return syncableStore;
    }

    const added = await addMail(trace, syncableStore.value, {
      from: 'test@freedomtechhq.com',
      to: ['test@freedomtechhq.com'],
      subject: `Test Email (${new Date().toISOString()})`,
      body: 'This is a test email',
      timeMSec: Date.now(),
      attachments: []
    });
    if (!added.ok) {
      return added;
    }

    return makeSuccess(undefined);
  }
);
