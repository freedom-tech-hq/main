import 'dotenv/config';

import fs from 'node:fs/promises';
import https from 'node:https';
import process from 'node:process';

import { log, makeAsyncFunc } from 'freedom-async';
import { getOrCreateServiceContext, traceServiceContextProvider } from 'freedom-trace-service-context';

import { makeExpressApp } from './makeExpressApp.ts';
import { startServer } from './startServer.ts';

export const startHttpsRestServer = makeAsyncFunc([import.meta.filename], async (trace) => {
  const keyPath = process.env.HTTPS_SERVER_KEY_PATH;
  const certPath = process.env.HTTPS_SERVER_CERT_PATH;

  if (keyPath === undefined || certPath === undefined) {
    log().error?.(trace, "HTTPS server can't be used without values for HTTPS_SERVER_KEY_PATH and HTTPS_SERVER_CERT_PATH");
    process.exit(1); // Fatal error
  }

  const [key, cert] = await Promise.all([fs.readFile(keyPath), fs.readFile(certPath)]);

  const app = await makeExpressApp(trace);

  const httpApiHandlerServiceContext = getOrCreateServiceContext(app.getYaschemaApiExpressContext?.());

  return await traceServiceContextProvider(trace, httpApiHandlerServiceContext, (trace) =>
    startServer(trace, https.createServer({ key, cert }, app))
  );
});
