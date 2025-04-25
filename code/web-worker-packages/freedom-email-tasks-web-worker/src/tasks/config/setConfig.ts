import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { setDefaultUrlBase } from 'yaschema-api';

import type { EmailTasksWebWorkerConfig } from '../../types/config/EmailTasksWebWorkerConfig.ts';

let globalConfig: EmailTasksWebWorkerConfig | undefined = undefined;

export const getConfig = (): EmailTasksWebWorkerConfig => {
  if (globalConfig === undefined) {
    throw new Error(`config not initialized for ${import.meta.filename}`);
  }

  return globalConfig!;
};

export const setConfig = makeAsyncResultFunc(
  [import.meta.filename, 'setConfig'],
  async (_trace, config: EmailTasksWebWorkerConfig): PR<undefined> => {
    globalConfig = config;

    setDefaultUrlBase(config.mailApiServerBaseUrl);

    return makeSuccess(undefined);
  }
);
