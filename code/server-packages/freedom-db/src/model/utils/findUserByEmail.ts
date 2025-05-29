import { makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import { InternalSchemaValidationError, NotFoundError } from 'freedom-common-errors';

import { dbQuery } from '../../db/postgresClient.ts';
import type { RawUser } from '../internal/types/RawUser.ts';
import type { User } from '../types/exports.ts';
import { userSchema } from '../types/User.ts';

export const findUserByEmail = makeAsyncResultFunc(
  [import.meta.filename, 'findUserByEmail'],
  async (trace, email: string): PR<User, 'not-found'> => {
    // Find
    const result = await dbQuery<RawUser>('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return makeFailure(
        new NotFoundError(trace, {
          errorCode: 'not-found',
          message: `User not found by email`
        })
      );
    }

    // Deserialize
    const deserialization = userSchema.deserialize(result.rows[0]);
    if (deserialization.error !== undefined) {
      return makeFailure(
        new InternalSchemaValidationError(trace, {
          message: `Deserialization failed: ${deserialization.error}`
        })
      );
    }

    return makeSuccess(deserialization.deserialized);
  }
);
