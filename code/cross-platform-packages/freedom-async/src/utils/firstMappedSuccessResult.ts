import type { Trace } from 'freedom-contexts';

import { GeneralError } from '../types/GeneralError.ts';
import type { PRFunc } from '../types/PRFunc.ts';
import type { FailureResult, Result } from '../types/Result.ts';
import { makeFailure } from '../types/Result.ts';
import { makeAsyncResultFunc } from './makeAsyncResultFunc.ts';

/** Stops and returns on the first success result.  Otherwise returns the last failure result or an 'empty-data-set' failure if nothing was
 * run. */
export const firstMappedSuccessResult = makeAsyncResultFunc(
  [import.meta.filename],
  async <V, T, ErrorCodeT extends string = never>(
    trace: Trace,
    values: V[],
    callback: PRFunc<T, ErrorCodeT, [value: V, index: number]>
  ): Promise<Result<T, ErrorCodeT | 'empty-data-set'>> => {
    if (values.length === 0) {
      return makeFailure(new GeneralError(trace, undefined, 'empty-data-set'));
    }

    let failureResult: FailureResult<ErrorCodeT> | undefined;

    let index = 0;
    for (const value of values) {
      const result = await callback(trace, value, index);
      if (result.ok) {
        return result;
      }

      failureResult = result;

      index += 1;
    }

    return failureResult!;
  }
);
