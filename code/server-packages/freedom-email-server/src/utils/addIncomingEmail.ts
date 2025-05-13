import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { findUserByEmail } from 'freedom-db';
import { addMail, type StoredMail } from 'freedom-email-sync';

import { getEmailAgentSyncableStoreForUser } from './getEmailAgentSyncableStoreForUser.ts';

export const addIncomingEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, recipientEmail: string, mail: StoredMail): PR<undefined> => {
    const user = await findUserByEmail(trace, recipientEmail);
    if (!user.ok) {
      return generalizeFailureResult(trace, user, 'not-found');
    }

    const syncableStoreResult = await getEmailAgentSyncableStoreForUser(trace, user.value);
    if (!syncableStoreResult.ok) {
      return syncableStoreResult;
    }

    const added = await addMail(trace, syncableStoreResult.value, mail);
    if (!added.ok) {
      return added;
    }

    return makeSuccess(undefined);
  }
);
