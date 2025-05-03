import { bestEffort, callAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { addUser, deleteUserByUserId } from 'freedom-db';
import { toStore } from 'freedom-email-server';
import { emailUserIdInfo } from 'freedom-email-sync';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api } from 'freedom-store-api-server-api';
import { DEFAULT_SALT_ID, storageRootIdInfo } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import * as config from '../config.ts';
import { setupKeyHandlers } from '../utils/setupKeyHandlers.ts';

const { createSyncableStore } = toStore;

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
          metadata, // Provenance (origin - signature, acceptance)
          creatorPublicKeys, // 2 public keys: verification and encryption
          saltsById // { SALT_default: 'salt-value' } - there's a constant for SALT_default
        }
      }
    }
  ) => {
    // Extract userId from inputs
    const userId = emailUserIdInfo.checked(storageRootIdInfo.removePrefix(storageRootId));
    if (userId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'Expected a valid EmailUserId' }));
    }

    // Emulate 3rd-party events in dev mode
    // Uses the most recently attempted registration of storageRootId
    DEV: await bestEffort(trace, setupKeyHandlers(trace, { userId }));

    // Add user to database, lock the name or fail on collision
    const email = `${name}@${config.EMAIL_DOMAIN}`;
    const userAdded = await addUser(trace, {
      email,
      userId,
      publicKeys: creatorPublicKeys,
      defaultSalt: saltsById[DEFAULT_SALT_ID]! // TODO: Require presence
    });
    if (!userAdded.ok) {
      return userAdded;
    }

    // Tear down on failure
    return await callAsyncResultFunc(
      trace,
      {
        // Tear down
        onError: () => {
          bestEffort(trace, deleteUserByUserId(trace, userId));
        }
      },
      async (trace) => {
        // Create user's syncable store
        // Conflicts are expected to happen here sometimes because registration is attempted every time a client starts its sync service
        // (because it can't otherwise knows the state of registration on the server)
        const createSyncableStoreResult = await disableLam(trace, 'conflict', (trace) =>
          createSyncableStore(trace, {
            userId,
            metadata,
            creatorPublicKeys
          })
        );
        if (!createSyncableStoreResult.ok) {
          return createSyncableStoreResult;
        }

        // Complete
        return makeSuccess({});
      }
    );
  }
);
