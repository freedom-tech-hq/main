import 'dotenv/config';

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import expressWs from 'express-ws';
import { finalizeApiHandlerRegistrations } from 'express-yaschema-api-handler';
import { inline, log, makeAsyncFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { StatusCodes } from 'http-status-codes';

import registerDefaultApiHandlers from './api-handlers/index.ts';
import type { ExpressWithWS } from './types/ExpressWithWs.ts';

export const makeExpressApp = makeAsyncFunc([import.meta.filename], async (trace: Trace): Promise<ExpressWithWS> => {
  const app = express();

  const CORS_ORIGINS = process.env.CORS_ORIGINS;

  if (CORS_ORIGINS !== undefined) {
    app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
  }
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  expressWs(app);
  const appWithWs = app as ExpressWithWS;

  const registerApiHandlers = inline((): ((app: ExpressWithWS) => Promise<any>) => {
    log().info?.(trace, 'Registering API handlers');

    return (appWithWs: ExpressWithWS) => registerDefaultApiHandlers(appWithWs);
  });

  await registerApiHandlers(appWithWs);

  log().info?.(trace, 'Finalizing API handlers');

  finalizeApiHandlerRegistrations();

  app.all(/.*/, (req, res, _next) => {
    log().debug?.(trace, `Unhandled request encountered for path: ${req.path}`);
    res.status(StatusCodes.NOT_FOUND).send('Not found');
  });

  return appWithWs;
});
