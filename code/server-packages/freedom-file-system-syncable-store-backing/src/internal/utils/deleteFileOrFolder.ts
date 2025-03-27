import fs from 'node:fs/promises';

import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';

import { getFsPath } from './getFsPath.ts';

export const deleteFileOrFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootPath: string, ids: readonly SyncableId[]) => {
    const fsPath = await getFsPath(trace, rootPath, ids);
    if (!fsPath.ok) {
      return fsPath;
    }

    await fs.rm(fsPath.value, { recursive: true });

    return makeSuccess(undefined);
  }
);
