import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { getUserById } from 'freedom-db';
import { getEmailAgentSyncableStore } from 'freedom-email-server';
import type { EmailUserId } from 'freedom-email-sync';
import { addMail } from 'freedom-email-sync';
import { storageRootIdInfo } from 'freedom-sync-types';

export const addDemoEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    // Get store
    const user = await uncheckedResult(getUserById(trace, userId));

    const storageRootId = storageRootIdInfo.make(userId);
    const creatorPublicKeys = user.publicKeys;
    const saltsById = { [user.defaultSalt]: user.defaultSalt };

    const syncableStore = await uncheckedResult(getEmailAgentSyncableStore(trace, { storageRootId, creatorPublicKeys, saltsById }));

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
