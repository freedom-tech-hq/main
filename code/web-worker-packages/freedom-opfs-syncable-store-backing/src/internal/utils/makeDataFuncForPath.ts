import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';

import { getFileHandleForSyncablePath } from './getFileHandleForSyncablePath.ts';
import { readFile } from './readFile.ts';

export const makeDataFuncForPath = (rootHandle: FileSystemDirectoryHandle, path: SyncablePath) =>
  makeAsyncResultFunc([import.meta.filename], async (trace): PR<Uint8Array, 'not-found' | 'wrong-type'> => {
    const fileHandle = await getFileHandleForSyncablePath(trace, rootHandle, path);
    if (!fileHandle.ok) {
      return fileHandle;
    }

    return await readFile(trace, fileHandle.value, { lockKey: path.toString() });
  });
