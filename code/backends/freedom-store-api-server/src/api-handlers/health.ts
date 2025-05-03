import { makeSuccess } from 'freedom-async';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api } from 'freedom-store-api-server-api';

import { startedAt, version } from '../version.ts';

export default makeHttpApiHandler([import.meta.filename], { api: api.health.GET }, async () =>
  makeSuccess({ body: { version, startedAt: new Date(startedAt), healthy: true } })
);
