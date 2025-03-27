import type { Trace } from 'freedom-contexts';
import { default as pLimit } from 'p-limit';

import { log } from '../config/logging.ts';
import { FREEDOM_MAX_CONCURRENCY_DEFAULT } from '../consts/concurrency.ts';
import type { PR } from '../types/PR.ts';
import type { PRFunc } from '../types/PRFunc.ts';
import type { FailureResult } from '../types/Result.ts';
import { makeSuccess } from '../types/Result.ts';
import { makeAsyncResultFunc } from './makeAsyncResultFunc.ts';

/** If all results are ok, returns success with array of results.  Failures are never returned and the resulting array only includes success
 * results and `undefined` will be at the indices that failed. */
export const allResultsMappedSkipFailures = makeAsyncResultFunc(
  [import.meta.filename],
  async function <V, T, ErrorCodeT extends string, SkipErrorCodeT extends ErrorCodeT | 'generic'>(
    trace: Trace,
    values: readonly V[],
    {
      maxConcurrency = FREEDOM_MAX_CONCURRENCY_DEFAULT,
      onSuccess = 'continue',
      skipErrorCodes
    }: {
      _successType?: T;
      _errorCodeType?: ErrorCodeT;
      maxConcurrency?: number;
      /** @defaultValue `'continue'` */
      onSuccess?: 'stop' | 'continue';
      skipErrorCodes: Array<SkipErrorCodeT | 'generic'>;
    },
    callback: PRFunc<T, ErrorCodeT, [value: V, index: number]>
  ): PR<Array<T | undefined>, Exclude<ErrorCodeT, SkipErrorCodeT>> {
    const skipErrorCodesSet = new Set<ErrorCodeT | 'generic'>(skipErrorCodes);

    const limit = pLimit(maxConcurrency);

    let shouldStop = false;

    const output: Array<T | undefined> = Array<T | undefined>(values.length).fill(undefined);

    let firstNonSkippedFailure: FailureResult<Exclude<ErrorCodeT, SkipErrorCodeT>> | undefined;
    await Promise.all(
      values.map((value, index) =>
        limit(async () => {
          if (shouldStop) {
            return;
          }

          try {
            const result = await callback(trace, value, index);
            if (!result.ok) {
              if (firstNonSkippedFailure === undefined && !skipErrorCodesSet.has(result.value.errorCode)) {
                firstNonSkippedFailure = result as FailureResult<Exclude<ErrorCodeT, SkipErrorCodeT>>;
                shouldStop = true;
              }
              return;
            }

            output[index] = result.value;

            if (onSuccess === 'stop') {
              shouldStop = true;
            }
          } catch (e) {
            /* node:coverage ignore next */
            log().info?.(trace, e);
          }
        })
      )
    );

    if (firstNonSkippedFailure !== undefined) {
      return firstNonSkippedFailure;
    }

    return makeSuccess(output);
  }
);
