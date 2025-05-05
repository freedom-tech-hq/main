import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { findUserByEmail } from 'freedom-db';
import { addMail, type StoredMail } from 'freedom-email-sync';

import { getEmailAgentSyncableStore } from './getEmailAgentSyncableStore.ts';

export const addIncomingEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, recipientEmail: string, mail: StoredMail): PR<undefined> => {
    const userResult = await findUserByEmail(trace, recipientEmail);
    if (!userResult.ok) {
      return generalizeFailureResult(trace, userResult, 'not-found');
    }

    const syncableStoreResult = await getEmailAgentSyncableStore(trace, userResult.value);
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
