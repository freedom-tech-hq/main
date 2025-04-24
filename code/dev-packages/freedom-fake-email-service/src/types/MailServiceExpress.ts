import type { Express } from 'express';
import type { WithWebsocketMethod } from 'express-ws';
import type { YaschemaApiExpressContextAccessor } from 'express-yaschema-api-handler';

export type MailServiceExpress = Express & WithWebsocketMethod & YaschemaApiExpressContextAccessor;
