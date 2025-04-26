import { makeSuccess, uncheckedResult } from 'freedom-async';
import { getServerPrivateKeys } from 'freedom-db';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

export default makeHttpApiHandler([import.meta.filename], { api: api.publicKeys.GET }, async (trace) => {
  const serverPrivateKeys = await uncheckedResult(getServerPrivateKeys(trace));
  const serverPublicKeys = serverPrivateKeys.publicOnly();

  return makeSuccess({ body: serverPublicKeys });
});
