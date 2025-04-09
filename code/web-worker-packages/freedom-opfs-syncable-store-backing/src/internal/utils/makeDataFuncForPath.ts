import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { SyncablePath } from 'freedom-sync-types';

import { getDirectoryHandle } from './getDirectoryHandle.ts';
import { readFile } from './readFile.ts';

export const makeDataFuncForPath = (rootHandle: FileSystemDirectoryHandle, path: SyncablePath) =>
  makeAsyncResultFunc([import.meta.filename], async (trace): PR<Uint8Array, 'not-found' | 'wrong-type'> => {
    const dir = await getDirectoryHandle(trace, rootHandle, path.parentPath!);
    if (!dir.ok) {
      return dir;
    }

    try {
      const fileHandle = await dir.value.getFileHandle(encodeURIComponent(path.lastId!));
      return await readFile(trace, fileHandle, { lockKey: path.toString() });
    } catch (e) {
      return makeFailure(
        new NotFoundError(trace, {
          message: `Failed to read file at ${path.toString()}`,
          cause: new GeneralError(trace, e),
          errorCode: 'not-found'
        })
      );
    }
  });
