import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { withAcquiredLock } from 'freedom-locking-types';

import { getLockStore } from './getLockStore.ts';

export const readFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, fileHandle: FileSystemFileHandle, { lockKey }: { lockKey: string }): PR<Uint8Array> => {
    const lockStore = getLockStore();

    const completed = await withAcquiredLock(trace, lockStore.lock(lockKey), {}, async (): PR<Uint8Array> => {
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();
      return makeSuccess(Buffer.from(buffer));
    });
    if (!completed.ok) {
      return generalizeFailureResult(trace, completed, 'lock-timeout');
    }

    return makeSuccess(completed.value);
  }
);
