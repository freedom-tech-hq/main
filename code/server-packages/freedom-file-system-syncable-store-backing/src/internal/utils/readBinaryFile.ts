import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import { withAcquiredLock } from 'freedom-locking-types';
import { get } from 'lodash-es';

import { getLockStore } from './getLockStore.ts';

export const readBinaryFile = makeAsyncResultFunc([import.meta.filename], async (trace, filePath: string): PR<Uint8Array, 'not-found'> => {
  const lockStore = getLockStore();

  const completed = await withAcquiredLock(trace, lockStore.lock(filePath), {}, async (_trace): PR<Uint8Array, 'not-found'> => {
    try {
      return makeSuccess(await fs.readFile(filePath));
    } catch (e) {
      if (get(e, 'code') === 'ENOENT') {
        return makeFailure(new NotFoundError(trace, { message: `No file found at ${filePath}`, errorCode: 'not-found' }));
      }

      return makeFailure(new GeneralError(trace, e));
    }
  });
  if (!completed.ok) {
    return generalizeFailureResult(trace, completed, 'lock-timeout');
  }

  return makeSuccess(completed.value);
});
