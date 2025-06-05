import { makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { addUser } from 'freedom-db';
import { emailUserIdInfo } from 'freedom-email-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api } from 'freedom-store-api-server-api';
import { storageRootIdInfo } from 'freedom-sync-types';

import * as config from '../config.ts';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.register.POST, disableLam: 'conflict' },
  async (
    trace,
    {
      input: {
        body: {
          name, // User's chosen username
          storageRootId, // It emerges on the client and it is globally unique
          creatorPublicKeys // 2 public keys: verification and encryption
        }
      }
    }
  ) => {
    // Extract userId from inputs
    const userId = emailUserIdInfo.checked(storageRootIdInfo.removePrefix(storageRootId));
    if (userId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'Expected a valid EmailUserId' }));
    }

    // Add user to database, lock the name or fail on collision
    const email = `${name}@${config.EMAIL_DOMAIN}`;
    const userAdded = await addUser(trace, { email, userId, publicKeys: creatorPublicKeys });
    if (!userAdded.ok) {
      return userAdded;
    }

    return makeSuccess({});
  }
);
