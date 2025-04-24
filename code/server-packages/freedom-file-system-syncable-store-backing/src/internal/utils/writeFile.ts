import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { withAcquiredLock } from 'freedom-locking-types';

import { getLockStore } from './getLockStore.ts';

export const writeFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, filePath: string, data: string | Uint8Array): PR<undefined> => {
    const lockStore = getLockStore();

    const completed = await withAcquiredLock(trace, lockStore.lock(filePath), {}, async (_trace): PR<undefined> => {
      if (typeof data === 'string') {
        await fs.writeFile(filePath, data, 'utf-8');
      } else {
        await fs.writeFile(filePath, data);
      }

      return makeSuccess(undefined);
    });
    if (!completed.ok) {
      return generalizeFailureResult(trace, completed, 'lock-timeout');
    }

    return makeSuccess(undefined);
  }
);
