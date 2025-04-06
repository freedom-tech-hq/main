import type { TypeOrPromisedType } from 'yaschema';

import type { ExpressWithYaschemaApi } from '../types/ExpressWithYaschemaApi.ts';

export const makeRegisterAllWithExpress =
  (...registerers: Array<(app: ExpressWithYaschemaApi) => TypeOrPromisedType<void>>) =>
  async (app: ExpressWithYaschemaApi) => {
    await Promise.all(registerers.map((reg) => reg(app)));
  };
