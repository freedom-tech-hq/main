import { makeSuccess } from 'freedom-async';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import type { SyncPullResponse } from 'freedom-sync-types';

export default makeHttpApiHandler([import.meta.filename], { api: api.pull.POST }, async (_trace) =>
  // TODO: TEMP
  makeSuccess({ body: { type: 'folder', outOfSync: false } satisfies SyncPullResponse })
);
