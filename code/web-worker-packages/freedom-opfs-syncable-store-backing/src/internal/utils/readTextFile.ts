import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';

import { readFile } from './readFile.ts';

export const readTextFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, fileHandle: FileSystemFileHandle, { lockKey }: { lockKey: string }): PR<string, 'format-error'> => {
    const data = await readFile(trace, fileHandle, { lockKey });
    if (!data.ok) {
      return data;
    }

    try {
      const stringValue = Buffer.from(data.value).toString('utf-8');
      return makeSuccess(stringValue);
    } catch (e) {
      return makeFailure(new ConflictError(trace, { cause: new GeneralError(trace, e), errorCode: 'format-error' }));
    }
  }
);
