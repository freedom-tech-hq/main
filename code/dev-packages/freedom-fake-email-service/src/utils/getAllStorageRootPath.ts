import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { computeAsyncOnce, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';

const secretKey = makeUuid();

export const getAllStorageRootPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace) =>
    await computeAsyncOnce([import.meta.filename], secretKey, async (_trace) => makeSuccess(fs.mkdtemp(path.join(os.tmpdir(), 'testing-'))))
);
