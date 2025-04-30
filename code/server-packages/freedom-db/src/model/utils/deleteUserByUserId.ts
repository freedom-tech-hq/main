import { allResults, makeAsyncResultFunc, makeSuccess, type PR, uncheckedResult } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';

import { getEmailByUserIdStore } from '../internal/utils/getEmailByUserIdStore.ts';
import { getUserStore } from '../internal/utils/getUserStore.ts';

export const deleteUserByUserId = makeAsyncResultFunc(
  [import.meta.filename, 'deleteUserByUserId'],
  async (trace, userId: EmailUserId): PR<void, 'not-found'> => {
    const emailByUserIdStore = await uncheckedResult(getEmailByUserIdStore(trace));
    const userStore = await uncheckedResult(getUserStore(trace));

    // Retrieve the email associated with this userId
    const emailResult = await emailByUserIdStore.object(userId).get(trace);
    if (!emailResult.ok) {
      return emailResult;
    }

    const email = emailResult.value;

    // Delete the email-by-userId mapping and the user data in parallel
    const result = await allResults(trace, [
      emailByUserIdStore.mutableObject(userId).delete(trace),
      userStore.mutableObject(email).delete(trace)
    ]);
    if (!result.ok) {
      return result;
    }

    return makeSuccess(undefined);
  }
);
