import type { Express } from 'express';
import type { YaschemaApiExpressContextAccessor } from 'express-yaschema-api-handler';
import type { PRFunc } from 'freedom-async';
import type { DataSources } from 'freedom-data-source-types';
import type { TypeOrPromisedType } from 'yaschema';
import type { Api } from 'yaschema-api';

export interface FreedomAppliancePlugin {
  publicApis: Api[];
  privateApis: Api[];
  registerWithExpress: (app: Express & YaschemaApiExpressContextAccessor) => TypeOrPromisedType<void>;
  connectToDataSources: PRFunc<undefined, never, [dataSources: DataSources]>;
}
