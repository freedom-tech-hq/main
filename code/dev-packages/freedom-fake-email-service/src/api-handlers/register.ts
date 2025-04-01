import { bestEffort, makeSuccess, uncheckedResult } from 'freedom-async';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

import { createSyncableStore } from '../utils/createSyncableStore.ts';
import { getServerPrivateKeys } from '../utils/getServerPrivateKeys.ts';
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
    const serverPrivateKeys = await uncheckedResult(getServerPrivateKeys(trace));
    const serverPublicKeys = serverPrivateKeys.publicOnly();

    // Uses the most recently attempted registration of storageRootId
    await bestEffort(trace, setupKeyHandlers(trace, { storageRootId }));

    const created = await createSyncableStore(trace, {
      storageRootId,
      metadata,
      creatorPublicKeys,
      saltsById
    });
    if (!created.ok) {
      return created;
    }

    return makeSuccess({ body: { serverPublicKeys } });
  }
);
