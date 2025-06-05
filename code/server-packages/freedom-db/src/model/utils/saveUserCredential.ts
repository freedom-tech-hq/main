import { makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import { type EmailUserId, type EncryptedEmailCredential, encryptedEmailCredentialSchema } from 'freedom-email-sync';
import { stringify } from 'freedom-serialization';

import { dbQuery } from '../../db/postgresClient.ts';

/** An `undefined` value for `encryptedCredentials` will clear the stored credentials */
export const saveUserCredential = makeAsyncResultFunc(
  [import.meta.filename, 'saveUserCredential'],
  async (trace, userId: EmailUserId, encryptedCredential: EncryptedEmailCredential): PR<void, 'not-found'> => {
    const encryptedCredentialJsonString = await stringify(trace, encryptedCredential, encryptedEmailCredentialSchema);
    if (!encryptedCredentialJsonString.ok) {
      return encryptedCredentialJsonString;
    }

    // Update the user's encrypted credentials
    const updateResult = await dbQuery('UPDATE users SET "encryptedCredentials" = $1 WHERE "userId" = $2', [
      encryptedCredentialJsonString.value,
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
