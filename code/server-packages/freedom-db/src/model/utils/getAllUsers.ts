import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import { log } from 'freedom-contexts';

import { dbQuery } from '../../db/postgresClient.ts';
import { getUserFromRawUser, type RawUser } from '../internal/types/RawUser.ts';
import type { DbUser } from '../types/DbUser.ts';

export const getAllUsers = makeAsyncResultFunc([import.meta.filename, 'getAllUsers'], async (trace): PR<DbUser[]> => {
  // Find
  const result = await dbQuery<RawUser>('SELECT * FROM users');

  // Deserialize
  const users: DbUser[] = [];
  for (const row of result.rows) {
    const userResult = await getUserFromRawUser(trace, row);
    if (!userResult.ok) {
      log().error?.(trace, 'Failed to deserialize user', userResult.value.message);
    } else {
      users.push(userResult.value);
    }
  }

  return makeSuccess(users);
});
