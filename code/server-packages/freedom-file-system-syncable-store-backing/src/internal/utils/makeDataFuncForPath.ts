import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';

import { getFsPath } from './getFsPath.ts';
import { readBinaryFile } from './readBinaryFile.ts';

export const makeDataFuncForPath = (rootPath: string, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc([import.meta.filename], async (trace): PR<Uint8Array, 'not-found' | 'wrong-type'> => {
    const filePath = getFsPath(rootPath, ids);

    return await readBinaryFile(trace, filePath);
  });
