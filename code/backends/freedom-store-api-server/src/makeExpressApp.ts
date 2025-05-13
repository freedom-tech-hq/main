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
import { inline, makeAsyncFunc } from 'freedom-async';
import { log, type Trace } from 'freedom-contexts';
import { StatusCodes } from 'http-status-codes';

import registerDefaultApiHandlers from './api-handlers/index.ts';
import * as config from './config.ts';
import type { MailServiceExpress } from './types/MailServiceExpress.ts';

export const makeExpressApp = makeAsyncFunc([import.meta.filename], async (trace: Trace): Promise<MailServiceExpress> => {
  const app = addYaschemaApiExpressContextAccessorToExpress(express() as MailServiceExpress, makeYaschemaApiExpressContext());

  app.use(cors({ origin: config.CORS_ORIGINS, credentials: true }));

  app.use(cookieParser());
  app.use(bodyParser.json({ limit: '2mb' }));
  app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));

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
