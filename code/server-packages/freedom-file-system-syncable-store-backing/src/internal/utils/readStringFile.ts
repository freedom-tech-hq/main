import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';

import { readBinaryFile } from './readBinaryFile.ts';

export const readStringFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, filePath: string): PR<string, 'not-found' | 'wrong-type'> => {
    const data = await readBinaryFile(trace, filePath);
    if (!data.ok) {
      return data;
    }

    try {
      return makeSuccess(Buffer.from(data.value).toString('utf-8'));
    } catch (_e) {
      return makeFailure(
        new NotFoundError(trace, {
          message: `Expected string file found binary`,
          errorCode: 'wrong-type'
        })
      );
    }
  }
);
