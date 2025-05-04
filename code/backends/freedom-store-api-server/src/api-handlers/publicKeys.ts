import { makeSuccess, uncheckedResult } from 'freedom-async';
import { getServerPrivateKeys } from 'freedom-db';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api } from 'freedom-store-api-server-api';

export default makeHttpApiHandler([import.meta.filename], { api: api.publicKeys.GET }, async (trace) => {
  const serverPrivateKeys = await uncheckedResult(getServerPrivateKeys(trace));
  const serverPublicKeys = serverPrivateKeys.publicOnly();

  return makeSuccess({ body: serverPublicKeys });
});
