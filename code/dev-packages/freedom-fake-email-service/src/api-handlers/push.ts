import { makeSuccess } from 'freedom-async';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

export default makeHttpApiHandler([import.meta.filename], { api: api.push.POST }, async (_trace) =>
  // TODO: TEMP
  makeSuccess({})
);
