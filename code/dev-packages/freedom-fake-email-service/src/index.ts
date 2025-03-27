import { makeAsyncFunc } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';

import { startHttpRestServer } from './startHttpRestServer.ts';
import { startHttpsRestServer } from './startHttpsRestServer.ts';

makeAsyncFunc([import.meta.filename], async (trace) => {
  const keyPath = process.env.HTTPS_SERVER_KEY_PATH;
  const certPath = process.env.HTTPS_SERVER_CERT_PATH;
  const shouldUseHttps = keyPath !== undefined && certPath !== undefined;

  return shouldUseHttps ? await startHttpsRestServer(trace) : await startHttpRestServer(trace);
})(makeTrace());
