import { makeSuccess } from 'freedom-async';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api } from 'freedom-store-api-server-api';

import * as config from '../config.ts';

export default makeHttpApiHandler([import.meta.filename], { api: api.publicKeys.GET }, async (_trace) => {
  const serverPublicKeys = config.MAIL_AGENT_USER_KEYS.publicOnly();

  return makeSuccess({ body: serverPublicKeys });
});
