import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import { log } from 'freedom-contexts';

import { dbQuery } from '../../db/postgresClient.ts';
import type { RawUser } from '../internal/types/RawUser.ts';
import { type User, userSchema } from '../types/User.ts';

export const getAllUsers = makeAsyncResultFunc([import.meta.filename, 'getAllUsers'], async (trace): PR<User[]> => {
  // Find
  const result = await dbQuery<RawUser>('SELECT * FROM users');

  // Deserialize
  const users: User[] = [];
  for (const row of result.rows) {
    const deserialization = userSchema.deserialize(row);
    if (deserialization.error !== undefined) {
      log().error?.(trace, 'Failed to deserialize user', deserialization.error);
    } else {
      users.push(deserialization.deserialized);
    }
  }

  return makeSuccess(users);
});
