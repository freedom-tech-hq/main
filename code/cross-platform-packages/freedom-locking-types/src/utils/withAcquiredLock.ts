import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

import { acquiredLocksProvider, useAcquiredLocks } from '../types/acquired-locks.ts';
import type { Lock } from '../types/Lock.ts';
import type { LockOptions } from '../types/LockOptions.ts';

export const withAcquiredLock = makeAsyncResultFunc(
  [import.meta.filename],
  async <SuccessT, ErrorCodeT extends string = never>(
    trace: Trace,
    lock: Lock,
    options: LockOptions,
    callback: PRFunc<SuccessT, ErrorCodeT>
  ): PR<SuccessT, ErrorCodeT | 'lock-timeout'> => {
    // If the lock was already acquired in the current trace, we shouldn't try to acquire it again.
    const acquiredLocks = useAcquiredLocks(trace);
    if (acquiredLocks.acquiredLockUids.has(lock.uid)) {
      return await callback(trace);
    }

    const lockToken = await lock.acquire(trace, options);
    if (!lockToken.ok) {
      return lockToken;
    }

    try {
      return await acquiredLocksProvider(trace, { acquiredLockUids: [lock.uid] }, callback);
    } finally {
      // Ignoring errors during lock release
      await lock.release(trace, lockToken.value);
    }
  }
);
