import type { Express } from 'express';
import type { YaschemaApiExpressContextAccessor } from 'express-yaschema-api-handler';

export type ExpressWithYaschemaApi = Express & YaschemaApiExpressContextAccessor;
