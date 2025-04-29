import http from 'node:http';

import { makeAsyncFunc } from 'freedom-async';
import { getOrCreateServiceContext, traceServiceContextProvider } from 'freedom-trace-service-context';

import { makeExpressApp } from './makeExpressApp.ts';
import { startServer } from './startServer.ts';

export const startHttpRestServer = makeAsyncFunc([import.meta.filename], async (trace) => {
  const app = await makeExpressApp(trace);

  const httpApiHandlerServiceContext = getOrCreateServiceContext(app.getYaschemaApiExpressContext?.());

  return await traceServiceContextProvider(trace, httpApiHandlerServiceContext, (trace) => startServer(trace, http.createServer(app)));
});
