import fs from 'node:fs';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { initConfig as dbInitConfig } from 'freedom-db';
import { initConfig as emailServerInitConfig } from 'freedom-email-server';
import { initConfig as syncableStoreServerInitConfig } from 'freedom-syncable-store-server';

import * as rawConfig from './config.ts';

// Some reference safety
const config = Object.freeze({ ...rawConfig });

export const initApp = makeAsyncResultFunc([import.meta.filename], async (_trace): PR<void> => {
  // Dev-env startup simplifications
  DEV: {
    if (!fs.existsSync(config.STORAGE_ROOT_PATH)) {
      fs.mkdirSync(config.STORAGE_ROOT_PATH, { recursive: true });
    }
    console.log(`STORAGE_ROOT_PATH=${config.STORAGE_ROOT_PATH}`);
  }

  // Modules
  dbInitConfig(config);
  syncableStoreServerInitConfig(config);
  emailServerInitConfig(config);

  return makeSuccess(undefined);
});
