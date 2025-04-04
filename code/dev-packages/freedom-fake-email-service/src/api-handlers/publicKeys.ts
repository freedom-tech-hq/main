import { makeSuccess, uncheckedResult } from 'freedom-async';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

import { getServerPrivateKeys } from '../utils/getServerPrivateKeys.ts';

export default makeHttpApiHandler([import.meta.filename], { api: api.publicKeys.GET }, async (trace) => {
  const serverPrivateKeys = await uncheckedResult(getServerPrivateKeys(trace));
  const serverPublicKeys = serverPrivateKeys.publicOnly();

  return makeSuccess({ body: serverPublicKeys });
});
