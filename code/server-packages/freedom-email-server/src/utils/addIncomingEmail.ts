import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { findUserByEmail } from 'freedom-db';
import { addMail, type StoredMail } from 'freedom-email-sync';
import { createEmailSyncableStore1 } from 'freedom-syncable-store-server';

export const addIncomingEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, recipientEmail: string, mail: StoredMail): PR<undefined> => {
    const userResult = await findUserByEmail(trace, recipientEmail);
    if (!userResult.ok) {
      return generalizeFailureResult(trace, userResult, 'not-found');
    }

    const { userId, publicKeys, defaultSalt } = userResult.value;

    const syncableStore = await uncheckedResult(
      createEmailSyncableStore1(trace, {
        userId,
        publicKeys: publicKeys,
        saltsById: { SALT_default: defaultSalt }
      })
    );

    const added = await addMail(trace, syncableStore, mail);
    if (!added.ok) {
      return added;
    }

    return makeSuccess(undefined);
  }
);
