import { bestEffort, makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { emailUserIdInfo } from 'freedom-email-sync';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { storageRootIdInfo, DEFAULT_SALT_ID } from 'freedom-sync-types';

import { createSyncableStore } from '../utils/createSyncableStore.ts';
import { setupKeyHandlers } from '../utils/setupKeyHandlers.ts';
import { addUser } from '../utils/mockUserDb.ts';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.register.POST },
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

    const created = await createSyncableStore(trace, {
      userId,
      metadata,
      creatorPublicKeys,
      saltsById
    });
    if (!created.ok) {
      return created;
    }

    // Add email
    const usedAdded = await addUser(trace, {
      email: `user${Math.random()}@local.dev.freedommail.me`, // TODO: Get from the outside
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
