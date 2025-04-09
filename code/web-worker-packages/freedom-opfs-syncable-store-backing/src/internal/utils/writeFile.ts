import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { withAcquiredLock } from 'freedom-locking-types';

import { getLockStore } from './getLockStore.ts';

export const writeFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, fileHandle: FileSystemFileHandle, { lockKey, data }: { lockKey: string; data: Uint8Array }): PR<undefined> => {
    const lockStore = getLockStore();

    const completed = await withAcquiredLock(trace, lockStore.lock(lockKey), {}, async (): PR<undefined> => {
      const syncFileHandle = await fileHandle.createSyncAccessHandle();
      try {
        syncFileHandle.truncate(data.byteLength);
        syncFileHandle.write(data);
        syncFileHandle.flush();
      } finally {
        syncFileHandle.close();
      }

      return makeSuccess(undefined);
    });
    if (!completed.ok) {
      return generalizeFailureResult(trace, completed, 'lock-timeout');
    }

    return makeSuccess(completed.value);
  }
);
