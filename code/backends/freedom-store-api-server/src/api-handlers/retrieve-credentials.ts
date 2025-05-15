import { makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import { findUserByEmail } from 'freedom-db';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api } from 'freedom-store-api-server-api';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.retrieveCredentials.POST },
  async (
    trace,
    {
      input: {
        body: { email }
      }
    }
  ) => {
    // Look up the user by email
    const userResult = await findUserByEmail(trace, email);

    // If user not found, return success but with no credentials
    if (!userResult.ok) {
      if (userResult.value.errorCode === 'not-found') {
        return makeFailure(new NotFoundError(trace, { message: 'User not found', errorCode: 'not-found' }));
      }
      return userResult;
    }

    // Return the user ID and encrypted credentials if they exist
    const { userId, encryptedCredentials } = userResult.value;
    if (encryptedCredentials === undefined) {
      return makeFailure(new NotFoundError(trace, { message: 'Credential not found', errorCode: 'not-found' }));
    }

    return makeSuccess({ body: { userId, encryptedCredentials } });
  }
);
