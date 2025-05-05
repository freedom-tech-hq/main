import { allResults, makeAsyncResultFunc, makeFailure, makeSuccess, type PR, uncheckedResult } from 'freedom-async';
import { ConflictError, generalizeFailureResult } from 'freedom-common-errors';
import { forceSetObjectValue } from 'freedom-object-store-types';
import { isEqual } from 'lodash-es';

import { getEmailByUserIdStore } from '../internal/utils/getEmailByUserIdStore.ts';
import { getPublicKeyStore } from '../internal/utils/getPublicKeyStore.ts';
import { getUserStore } from '../internal/utils/getUserStore.ts';
import type { User } from '../types/User.ts';

type ErrorCodes = 'already-created' | 'conflict' | 'email-is-unavailable';

export const addUser = makeAsyncResultFunc([import.meta.filename, 'addUser'], async (trace, user: User): PR<User, ErrorCodes> => {
  const userStore = await uncheckedResult(getUserStore(trace));
  const emailByUserIdStore = await uncheckedResult(getEmailByUserIdStore(trace));

  // TODO: Revise the transaction logic here when we have the final decision on DB engine
  //  until that moment - keep it trivial

  // Check if a user with this userId already exists
  const existingEmailResult = await emailByUserIdStore.object(user.userId).get(trace);
  if (existingEmailResult.ok) {
    // A user with this userId exists, check if the email matches
    if (existingEmailResult.value !== user.email) {
      return makeFailure(
        new ConflictError(trace, {
          message: `User with id ${user.userId} already exists with a different email: ${existingEmailResult.value}`,
          errorCode: 'conflict'
        })
      );
    }

    // Get the whole user record
    const existingUserResult = await userStore.object(existingEmailResult.value).get(trace);
    if (!existingUserResult.ok) {
      return generalizeFailureResult(trace, existingUserResult, ['not-found']);
    }

    // Detect a duplicate request to handle it softly
    if (isEqual(existingUserResult.value, user)) {
      return makeFailure(
        new ConflictError(trace, {
          message: 'User already exists with identical information',
          errorCode: 'already-created'
        })
      );
    }

    // User with this userId already exists
    return makeFailure(
      new ConflictError(trace, {
        message: 'User with this userId already exists',
        errorCode: 'conflict'
      })
    );
  }

  // Check if the email is already taken by another userId
  const userByEmailResult = await userStore.object(user.email).get(trace);
  if (userByEmailResult.ok && userByEmailResult.value.userId !== user.userId) {
    return makeFailure(
      new ConflictError(trace, {
        message: `Email ${user.email} is already assigned to userId ${userByEmailResult.value.userId}`,
        errorCode: 'email-is-unavailable'
      })
    );
  }

  // All checks passed, proceed with creating the user
  const userAccessor = userStore.mutableObject(user.email);
  const emailByUserIdAccessor = emailByUserIdStore.mutableObject(user.userId);

  const setResult = await allResults(trace, [
    forceSetObjectValue(trace, userAccessor, user),
    forceSetObjectValue(trace, emailByUserIdAccessor, user.email)
  ]);
  if (!setResult.ok) {
    return setResult;
  }

  // Not merged with previous allResults(), moved from createSyncableStore.ts. Revise everything
  const publicKeyStore = await uncheckedResult(getPublicKeyStore(trace));
  const storedPublicKey = await publicKeyStore.mutableObject(user.publicKeys.id).create(trace, user.publicKeys);
  if (!storedPublicKey.ok && storedPublicKey.value.errorCode !== 'conflict') {
    // Ignoring if the public key was already stored
    return storedPublicKey;
  }

  return makeSuccess(user);
});
