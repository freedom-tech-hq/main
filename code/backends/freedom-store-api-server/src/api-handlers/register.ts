import { bestEffort, makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { addUser } from 'freedom-db';
import { emailUserIdInfo } from 'freedom-email-sync';
import { createSyncableStore } from 'freedom-fake-email-service';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { DEFAULT_SALT_ID, storageRootIdInfo } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import * as config from '../config.ts';
import { setupKeyHandlers } from '../utils/setupKeyHandlers.ts';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.register.POST, disableLam: 'conflict' },
  async (
    trace,
    {
      input: {
        body: {
          storageRootId, // It emerges on the client and it is globally unique
          metadata, // Provenance (origin - signature, acceptance)
          creatorPublicKeys, // 2 public keys: verification and encryption
          saltsById // { SALT_default: 'salt-value' } - there's a constant for SALT_default
        }
      }
    }
  ) => {
    const userId = emailUserIdInfo.checked(storageRootIdInfo.removePrefix(storageRootId));
    if (userId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'Expected a valid EmailUserId' }));
    }

    // Uses the most recently attempted registration of storageRootId
    await bestEffort(trace, setupKeyHandlers(trace, { userId }));

    // Conflicts are expected to happen here sometimes because registration is attempted every time a client starts its sync service
    // (because it can't otherwise knows the state of registration on the server)
    const createdSyncableStore = await disableLam(trace, 'conflict', (trace) =>
      createSyncableStore(trace, {
        userId,
        metadata,
        creatorPublicKeys
      })
    );
    if (!createdSyncableStore.ok) {
      return createdSyncableStore;
    }

    // Generate email TODO: Get from the outside
    const email = `user${Math.random()}@${config.EMAIL_DOMAIN}`;

    // Add email
    const usedAdded = await addUser(trace, {
      email,
      userId,
      publicKeys: creatorPublicKeys,
      defaultSalt: saltsById[DEFAULT_SALT_ID]! // TODO: Require presence
    });
    if (!usedAdded.ok) {
      return usedAdded;
    }

    return makeSuccess({});
  }
);
