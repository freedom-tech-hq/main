import { makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import { ConflictError, InternalStateError } from 'freedom-common-errors';
import { isEqual } from 'lodash-es';
import { DatabaseError } from 'pg';

import { dbQuery } from '../../db/postgresClient.ts';
import type { RawUser } from '../internal/types/RawUser.ts';
import { type User, userSchema } from '../types/User.ts';

type ErrorCodes = 'already-created' | 'conflict' | 'email-unavailable';

export const addUser = makeAsyncResultFunc([import.meta.filename, 'addUser'], async (trace, user: User): PR<User, ErrorCodes> => {
  // Validate and convert
  const serialization = await userSchema.serializeAsync(user);
  if (serialization.error !== undefined) {
    return makeFailure(
      new InternalStateError(trace, {
        message: `Incorrect user data: ${serialization.error}`
      })
    );
  }

  // TODO: Study typing problem for serializing
  const rawUser = serialization.serialized as unknown as RawUser;
  rawUser.encryptedCredentials = rawUser.encryptedCredentials ?? null;

  try {
    await dbQuery(
      `
        INSERT INTO users (email, "userId", "publicKeys", "defaultSalt", "encryptedCredentials")
        VALUES ($1, $2, $3, $4, $5)
      `,
      [rawUser.email, rawUser.userId, rawUser.publicKeys, rawUser.defaultSalt, rawUser.encryptedCredentials ?? null]
    );
    return makeSuccess(user);
  } catch (error: unknown) {
    if (error instanceof DatabaseError && error.code === '23505') {
      // Duplicate userId
      if (error.constraint === 'users_pkey') {
        // errorCode = already-created
        // Transaction is not required
        const existingUserResult = await dbQuery<RawUser>('SELECT * FROM users WHERE "userId" = $1', [user.userId]);
        if (existingUserResult.rows.length === 1 && isEqual(existingUserResult.rows[0], rawUser)) {
          return makeFailure(
            new ConflictError(trace, {
              message: 'User already exists',
              errorCode: 'already-created'
            })
          );
        }

        // errorCode = conflict
        return makeFailure(
          new ConflictError(trace, {
            message: 'UserId has already been registered',
            errorCode: 'conflict'
          })
        );
      }

      // Duplicate email
      if (error.constraint === 'users_email_key') {
        return makeFailure(
          new ConflictError(trace, {
            message: 'Email already exists',
            errorCode: 'email-unavailable'
          })
        );
      }
    }
    throw error;
  }
});
