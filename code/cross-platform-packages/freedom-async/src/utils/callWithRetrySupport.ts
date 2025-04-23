import type { FailureResult, SuccessResult } from '../types/Result.ts';
import type { ShouldRetryFunc } from '../types/ShouldRetryFunc.ts';
import { sleep } from './sleep.ts';

/**
 * If `shouldRetry` is `undefined`, calls the attempt function once with `attemptCount = 0`.
 *
 * Otherwise, it calls the attempt function in a loop until it returns a success result or `shouldRetry` returns `{ retry: false }` (or an
 * exception is thrown).
 */
export const callWithRetrySupport = async <SuccessT, ErrorCodeT extends string = never>(
  shouldRetry: ShouldRetryFunc<ErrorCodeT> | undefined,
  attempt: (attemptCount: number) => Promise<SuccessResult<SuccessT> | FailureResult<ErrorCodeT>>
): Promise<SuccessResult<SuccessT> | FailureResult<ErrorCodeT>> => {
  if (shouldRetry !== undefined) {
    // If retrying is potentially supported

    const firstAttemptStart = performance.now();
    let attemptCount = 0;
    let accumulatedDelayMSec = 0;
    while (true) {
      const result = await attempt(attemptCount);
      if (result.ok) {
        return result;
      }

      const { retry, delayMSec = 0 } = shouldRetry?.(result, {
        attemptCount,
        accumulatedDelayMSec,
        firstAttemptTimeAgoMSec: performance.now() - firstAttemptStart
      }) ?? {
        retry: false
      };
      if (!retry) {
        return result;
      }

      await sleep(delayMSec);

      attemptCount += 1;
      accumulatedDelayMSec += delayMSec;
    }
  } else {
    // If retrying isn't supported

    return await attempt(0);
  }
};
