import type { Trace } from 'freedom-contexts';
import { default as pLimit } from 'p-limit';

import { log } from '../config/logging.ts';
import { FREEDOM_MAX_CONCURRENCY_DEFAULT } from '../consts/concurrency.ts';
import { GeneralError } from '../types/GeneralError.ts';
import type { PR } from '../types/PR.ts';
import type { PRFunc } from '../types/PRFunc.ts';
import type { FailureResult } from '../types/Result.ts';
import { makeFailure, makeSuccess } from '../types/Result.ts';
import { makeAsyncResultFunc } from './makeAsyncResultFunc.ts';

/** If all results are ok, returns success with array of results.  Otherwise, returns first failure. */
export const allResultsMapped = makeAsyncResultFunc(
  [import.meta.filename],
  async function <V, T, ErrorCodeT extends string = never>(
    trace: Trace,
    values: readonly V[],
    {
      maxConcurrency = FREEDOM_MAX_CONCURRENCY_DEFAULT,
      onFailure = 'continue'
    }: {
      maxConcurrency?: number;
      /** @defaultValue `'continue'` */
      onFailure?: 'stop' | 'continue';
    },
    callback: PRFunc<T, ErrorCodeT, [value: V, index: number]>
  ): PR<T[], ErrorCodeT> {
    const limit = pLimit(maxConcurrency);

    let shouldStop = false;

    let failureResult: FailureResult<ErrorCodeT> | undefined;
    const output: T[] = [];
    await Promise.all(
      values.map((value, index) =>
        limit(async () => {
          if (shouldStop) {
            return;
          }

          try {
            const result = await callback(trace, value, index);
            if (!result.ok) {
              if (failureResult === undefined) {
                failureResult = result;
              }
              if (onFailure === 'stop') {
                shouldStop = true;
              }
              return;
            }

            output[index] = result.value;
          } catch (e) {
            /* node:coverage disable */
            log().error?.(trace, e);
            failureResult = makeFailure(new GeneralError(trace, e));
            /* node:coverage enable */
          }
        })
      )
    );

    if (failureResult !== undefined) {
      return failureResult;
    }

    return makeSuccess(output);
  }
);
