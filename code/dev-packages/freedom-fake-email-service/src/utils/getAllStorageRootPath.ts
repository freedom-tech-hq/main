import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { getEnv } from 'freedom-contexts';
import { once } from 'lodash-es';

export const getAllStorageRootPath = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (_trace): PR<string> => {
    const rootPath = getEnv('STORAGE_ROOT_PATH', process.env.STORAGE_ROOT_PATH) ?? 'TEMP';
    if (rootPath === 'TEMP') {
      const tempPath = await fs.mkdtemp(path.join(os.tmpdir(), 'testing-'));
      console.log('rootPath', tempPath);
      return makeSuccess(tempPath);
    } else {
      console.log('rootPath', rootPath);
      return makeSuccess(rootPath);
    }
  })
);
