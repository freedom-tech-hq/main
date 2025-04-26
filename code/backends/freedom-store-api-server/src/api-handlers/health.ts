import { makeSuccess } from 'freedom-async';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

import { startedAt, version } from '../version.ts';

export default makeHttpApiHandler([import.meta.filename], { api: api.health.GET }, async () =>
  makeSuccess({ body: { version, startedAt: new Date(startedAt), healthy: true } })
);
