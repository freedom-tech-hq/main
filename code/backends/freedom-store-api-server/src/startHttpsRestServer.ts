import 'dotenv/config';

import https from 'node:https';
import process from 'node:process';

import { makeAsyncFunc } from 'freedom-async';
import { log } from 'freedom-contexts';
import { getOrCreateServiceContext, traceServiceContextProvider } from 'freedom-trace-service-context';

import * as config from './config.ts';
import { makeExpressApp } from './makeExpressApp.ts';
import { startServer } from './startServer.ts';

export const startHttpsRestServer = makeAsyncFunc([import.meta.filename], async (trace) => {
  if (config.HTTPS_SERVER_KEY === undefined || config.HTTPS_SERVER_CERT === undefined) {
    log().error?.(trace, "HTTPS server can't be used without values for HTTPS_SERVER_KEY_PATH and HTTPS_SERVER_CERT_PATH");
    process.exit(1); // Fatal error
  }

  const app = await makeExpressApp(trace);

  const httpApiHandlerServiceContext = getOrCreateServiceContext(app.getYaschemaApiExpressContext?.());

  return await traceServiceContextProvider(trace, httpApiHandlerServiceContext, (trace) =>
    startServer(trace, https.createServer({ key: config.HTTPS_SERVER_KEY, cert: config.HTTPS_SERVER_CERT }, app))
  );
});
