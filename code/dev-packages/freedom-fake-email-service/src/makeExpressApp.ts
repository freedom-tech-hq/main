import 'dotenv/config';

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import expressWs from 'express-ws';
import {
  addYaschemaApiExpressContextAccessorToExpress,
  finalizeApiHandlerRegistrations,
  makeYaschemaApiExpressContext
} from 'express-yaschema-api-handler';
import { inline, log, makeAsyncFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { StatusCodes } from 'http-status-codes';

import registerDefaultApiHandlers from './api-handlers/index.ts';
import type { MailServiceExpress } from './types/MailServiceExpress.ts';

export const makeExpressApp = makeAsyncFunc([import.meta.filename], async (trace: Trace): Promise<MailServiceExpress> => {
  const app = addYaschemaApiExpressContextAccessorToExpress(express() as MailServiceExpress, makeYaschemaApiExpressContext());

  const CORS_ORIGINS = process.env.CORS_ORIGINS;

  if (CORS_ORIGINS !== undefined) {
    app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
  }
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  expressWs(app);

  const registerApiHandlers = inline((): ((app: MailServiceExpress) => Promise<any>) => {
    log().info?.(trace, 'Registering API handlers');

    return (appWithWs: MailServiceExpress) => registerDefaultApiHandlers(appWithWs);
  });

  await registerApiHandlers(app);

  log().info?.(trace, 'Finalizing API handlers');

  finalizeApiHandlerRegistrations({ context: app.getYaschemaApiExpressContext?.() });

  app.all(/.*/, (req, res, _next) => {
    log().debug?.(trace, `Unhandled request encountered for path: ${req.path}`);
    res.status(StatusCodes.NOT_FOUND).send('Not found');
  });

  return app;
});
