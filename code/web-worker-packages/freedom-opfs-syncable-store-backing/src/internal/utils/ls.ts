import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';

export const ls = makeAsyncResultFunc([import.meta.filename], async (trace, dir: FileSystemDirectoryHandle): PR<string[]> => {
  const output: string[] = [];

  try {
    const keys = dir.keys();
    let cursor = await keys.next();
    while (cursor.done !== true) {
      output.push(cursor.value);
      cursor = await keys.next();
    }
    return makeSuccess(output);
  } catch (e) {
    return makeFailure(
      new NotFoundError(trace, {
        message: 'Failed to list directory contents',
        cause: new GeneralError(trace, e)
      })
    );
  }
});
