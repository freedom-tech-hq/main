import { makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { NotFoundError } from 'freedom-common-errors';
import type { EmailUserId } from 'freedom-email-sync';

import { dbQuery } from '../../db/postgresClient.ts';

/** An `undefined` value for `encryptedCredentials` will clear the stored credentials */
export const saveUserCredentials = makeAsyncResultFunc(
  [import.meta.filename, 'saveUserCredentials'],
  async (trace, userId: EmailUserId, encryptedCredentials: Base64String | undefined): PR<void, 'not-found'> => {
    // Update the user's encrypted credentials
    const updateResult = await dbQuery('UPDATE users SET "encryptedCredentials" = $1 WHERE "userId" = $2', [
      encryptedCredentials ?? null,
      userId
    ]);

    if (updateResult.rowCount === 0) {
      // Detect presence of the user
      const selectResult = await dbQuery('SELECT 1 FROM users WHERE "userId" = $1', [userId]);

      if (selectResult.rows.length === 0) {
        return makeFailure(
          new NotFoundError(trace, {
            message: `User not found`,
            errorCode: 'not-found'
          })
        );
      } // else the user exists, only the value was identical
    }

    return makeSuccess(undefined);
  }
);
