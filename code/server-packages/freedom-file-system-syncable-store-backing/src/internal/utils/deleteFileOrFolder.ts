import fs from 'node:fs/promises';

import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';

import { getFsPath } from './getFsPath.ts';

export const deleteFileOrFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace, rootPath: string, ids: readonly SyncableId[]) => {
    const fsPath = getFsPath(rootPath, ids);

    await fs.rm(fsPath, { recursive: true });

    return makeSuccess(undefined);
  }
);
