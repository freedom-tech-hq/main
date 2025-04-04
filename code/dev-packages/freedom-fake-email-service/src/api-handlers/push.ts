import { makeSuccess } from 'freedom-async';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { pushPath } from 'freedom-syncable-store-types';

import { getSyncableStore } from '../utils/getSyncableStore.ts';

export default makeHttpApiHandler([import.meta.filename], { api: api.push.POST }, async (trace, { input: { body: args } }) => {
  const syncableStore = await getSyncableStore(trace, { storageRootId: args.path.storageRootId });
  if (!syncableStore.ok) {
    return syncableStore;
  }

  const store = syncableStore.value.store;

  const pushed = await pushPath(trace, store, args);
  if (!pushed.ok) {
    return pushed;
  }

  return makeSuccess({});
});
