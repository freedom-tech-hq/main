import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { PR } from 'freedom-async';
import { computeAsyncOnce, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { getEnv, makeUuid } from 'freedom-contexts';

const secretKey = makeUuid();

export const getAllStorageRootPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace) =>
    await computeAsyncOnce([import.meta.filename], secretKey, async (_trace): PR<string> => {
      const rootPath =
        getEnv('FREEDOM_FAKE_EMAIL_SERVICE_ROOT_STORAGE_PATH', process.env.FREEDOM_FAKE_EMAIL_SERVICE_ROOT_STORAGE_PATH) ?? 'TEMP';
      if (rootPath === 'TEMP') {
        const tempPath = await fs.mkdtemp(path.join(os.tmpdir(), 'testing-'));
        return makeSuccess(tempPath);
      } else {
        return makeSuccess(rootPath);
      }
    })
);
