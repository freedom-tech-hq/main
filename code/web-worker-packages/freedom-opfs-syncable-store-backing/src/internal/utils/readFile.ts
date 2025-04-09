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
      const syncFileHandle = await fileHandle.createSyncAccessHandle();
      try {
        const buffer = new Uint8Array(syncFileHandle.getSize());
        syncFileHandle.read(buffer);
        return makeSuccess(buffer);
      } finally {
        syncFileHandle.close();
      }
    });
    if (!completed.ok) {
      return generalizeFailureResult(trace, completed, 'lock-timeout');
    }

    return makeSuccess(completed.value);
  }
);
