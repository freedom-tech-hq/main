import 'dotenv/config';

import http from 'node:http';

import { makeAsyncFunc } from 'freedom-async';

import { makeExpressApp } from './makeExpressApp.ts';
import { startServer } from './startServer.ts';

export const startHttpRestServer = makeAsyncFunc([import.meta.filename], async (trace) => {
  const app = await makeExpressApp(trace);

  return await startServer(trace, http.createServer(app));
});
