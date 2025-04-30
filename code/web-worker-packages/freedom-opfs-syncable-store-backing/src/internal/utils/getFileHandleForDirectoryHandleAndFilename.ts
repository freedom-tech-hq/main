import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';

export const getFileHandleForDirectoryHandleAndFilename = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    dir: FileSystemDirectoryHandle,
    filename: string,
    { create = false }: { create?: boolean } = {}
  ): PR<FileSystemFileHandle, 'not-found'> => {
    try {
      const fileHandle = await dir.getFileHandle(filename, { create });
      return makeSuccess(fileHandle);
    } catch (e) {
      return makeFailure(
        new NotFoundError(trace, {
          message: `Failed to read file at ${filename}`,
          cause: new GeneralError(trace, e),
          errorCode: 'not-found'
        })
      );
    }
  }
);
