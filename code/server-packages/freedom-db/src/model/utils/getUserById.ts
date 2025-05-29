import { makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { EmailUserId } from 'freedom-email-sync';

import { dbQuery } from '../../db/postgresClient.ts';
import { getUserFromRawUser, type RawUser } from '../internal/types/RawUser.ts';
import type { DbUser } from '../types/exports.ts';

export const getUserById = makeAsyncResultFunc([import.meta.filename], async (trace, userId: EmailUserId): PR<DbUser, 'not-found'> => {
  // Find
  const result = await dbQuery<RawUser>('SELECT * FROM users WHERE "userId" = $1', [userId]);
  if (result.rows.length === 0) {
    return makeFailure(
      new NotFoundError(trace, {
        errorCode: 'not-found',
        message: `User not found by email`
      })
    );
  }

  // Deserialize
  const userResult = await getUserFromRawUser(trace, result.rows[0]);
  if (!userResult.ok) {
    return userResult;
  }

  return makeSuccess(userResult.value);
});
