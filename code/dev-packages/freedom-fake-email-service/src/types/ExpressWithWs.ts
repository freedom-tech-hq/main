import type { Express } from 'express';
import type { WithWebsocketMethod } from 'express-ws';

export type ExpressWithWS = Express & WithWebsocketMethod;
