import { makeAsyncResultFunc, makeFailure, makeSuccess, type PR, uncheckedResult } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { NotFoundError } from 'freedom-common-errors';
import type { EmailUserId } from 'freedom-email-sync';
import { forceSetObjectValue } from 'freedom-object-store-types';

import { getEmailByUserIdStore } from '../internal/utils/getEmailByUserIdStore.ts';
import { getUserStore } from '../internal/utils/getUserStore.ts';

/** An `undefined` value for `encryptedCredentials` will clear the stored credentials */
export const saveUserCredentials = makeAsyncResultFunc(
  [import.meta.filename, 'saveUserCredentials'],
  async (trace, userId: EmailUserId, encryptedCredentials: Base64String | undefined): PR<void, 'not-found'> => {
    const userStore = await uncheckedResult(getUserStore(trace));
    const emailByUserIdStore = await uncheckedResult(getEmailByUserIdStore(trace));

    // First, get the user's email from userId
    const emailResult = await emailByUserIdStore.object(userId).get(trace);
    if (!emailResult.ok) {
      return makeFailure(
        new NotFoundError(trace, {
          message: `User with id ${userId} not found`,
          errorCode: 'not-found'
        })
      );
    }

    const email = emailResult.value;

    // Next, get the existing user data
    const userResult = await userStore.object(email).get(trace);
    if (!userResult.ok) {
      return makeFailure(
        new NotFoundError(trace, {
          message: `User data for email ${email} not found`,
          errorCode: 'not-found'
        })
      );
    }

    const user = userResult.value;

    // Update only the encryptedCredentials field
    const updatedUser = {
      ...user,
      encryptedCredentials
    };

    // Save the updated user back to the store
    const userAccessor = userStore.mutableObject(email);
    const updateResult = await forceSetObjectValue(trace, userAccessor, updatedUser);

    if (!updateResult.ok) {
      return updateResult;
    }

    return makeSuccess(undefined);
  }
);
