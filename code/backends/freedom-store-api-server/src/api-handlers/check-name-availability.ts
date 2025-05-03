import { excludeFailureResult, makeSuccess } from 'freedom-async';
import { findUserByEmail } from 'freedom-db';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api } from 'freedom-store-api-server-api';

import * as config from '../config.ts';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.checkNameAvailability.GET },
  async (
    trace,
    {
      input: {
        query: { name }
      }
    }
  ) => {
    // Check if the name is already taken by constructing the email
    const email = `${name}@${config.EMAIL_DOMAIN}`;
    const existingUserResult = await findUserByEmail(trace, email);

    // Expected outcomes
    if (existingUserResult.ok || existingUserResult.value.errorCode === 'not-found') {
      return makeSuccess({
        body: {
          available: !existingUserResult.ok
        }
      });
    }

    // Unexpected error
    return excludeFailureResult(existingUserResult, 'not-found');
  }
);
