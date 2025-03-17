import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

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
    const lockToken = await lock.acquire(trace, options);
    if (!lockToken.ok) {
      return lockToken;
    }

    try {
      return await callback(trace);
    } finally {
      // Ignoring errors during lock release
      await lock.release(trace, lockToken.value);
    }
  }
);
