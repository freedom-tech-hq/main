import { makeSuccess } from 'freedom-async';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

import { createSyncableStore } from '../utils/createSyncableStore.ts';

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
    const created = await createSyncableStore(trace, {
      storageRootId,
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
