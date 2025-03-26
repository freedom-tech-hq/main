import { ONE_MIN_MSEC } from '../internal/consts/time.ts';
import type { PR } from '../types/PR.ts';
import type { PRFunc } from '../types/PRFunc.ts';
import type { Result } from '../types/Result.ts';
import { makeAsyncResultFunc } from './makeAsyncResultFunc.ts';

/** Returns a function who's result, if successful, is cached for `recencyThresholdMSec` ms, where the time limit is refreshed each time the
 * function is called.  If the cache expires, the optional `onExpiration` called back is triggered.  This also deduplicates in-flight calls.
 */
export const makeRecencyCachingAsyncResultFunc = <SuccessT, ErrorCodeT extends string = never>(
  idStack: string[],
  func: PRFunc<SuccessT, ErrorCodeT>,
  { recencyThresholdMSec = ONE_MIN_MSEC, onExpiration }: { recencyThresholdMSec?: number; onExpiration?: (value: SuccessT) => void } = {}
): PRFunc<SuccessT, ErrorCodeT> => {
  let cached: PR<SuccessT, ErrorCodeT> | undefined;
  let cleanup: (() => void) | undefined;
  let cleanupTimeout: ReturnType<typeof setTimeout> | undefined;

  return makeAsyncResultFunc(idStack, async (trace): PR<SuccessT, ErrorCodeT> => {
    if (cached !== undefined) {
      // Refreshing cleanup timeout on every access
      if (cleanup !== undefined) {
        clearTimeout(cleanupTimeout);
        cleanupTimeout = setTimeout(cleanup, recencyThresholdMSec);
      }

      return await cached;
    }

    // eslint-disable-next-line no-async-promise-executor
    cached = new Promise<Result<SuccessT, ErrorCodeT>>(async (resolve, reject) => {
      try {
        const result = await func(trace);
        if (!result.ok) {
          cached = undefined;
          resolve(result);
          return;
        }

        cleanup = () => {
          onExpiration?.(result.value);

          cached = undefined;
          cleanup = undefined;
          cleanupTimeout = undefined;
        };
        cleanupTimeout = setTimeout(cleanup, recencyThresholdMSec);

        resolve(result);
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(e);
      }
    });
    return await cached;
  });
};
