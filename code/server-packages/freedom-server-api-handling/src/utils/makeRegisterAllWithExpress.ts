import type { Express } from 'express';
import type { YaschemaApiExpressContextAccessor } from 'express-yaschema-api-handler';
import type { TypeOrPromisedType } from 'yaschema';

export const makeRegisterAllWithExpress =
  (...registerers: Array<(app: Express & YaschemaApiExpressContextAccessor) => TypeOrPromisedType<void>>) =>
  async (app: Express & YaschemaApiExpressContextAccessor) => {
    await Promise.all(registerers.map((reg) => reg(app)));
  };
