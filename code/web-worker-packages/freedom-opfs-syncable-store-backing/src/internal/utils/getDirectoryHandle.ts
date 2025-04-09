import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { SyncablePath } from 'freedom-sync-types';

export const getDirectoryHandle = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootHandle: FileSystemDirectoryHandle, path: SyncablePath): PR<FileSystemDirectoryHandle, 'not-found'> => {
    let dir = rootHandle;
    try {
      for (const id of path.ids) {
        dir = await dir.getDirectoryHandle(encodeURIComponent(id));
      }
    } catch (e) {
      return makeFailure(
        new NotFoundError(trace, {
          message: `Failed to get directory at ${path.toString()}`,
          cause: new GeneralError(trace, e),
          errorCode: 'not-found'
        })
      );
    }
    return makeSuccess(dir);
  }
);
