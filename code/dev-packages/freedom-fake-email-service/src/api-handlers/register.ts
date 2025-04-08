import { bestEffort, makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { emailUserIdInfo } from 'freedom-email-sync';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { storageRootIdInfo } from 'freedom-sync-types';

import { createSyncableStore } from '../utils/createSyncableStore.ts';
import { setupKeyHandlers } from '../utils/setupKeyHandlers.ts';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.register.POST },
  async (
    trace,
    {
      input: {
        body: { storageRootId, metadata, creatorPublicKeys, saltsById }
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

    return makeSuccess({});
  }
);
