import type { FailureResult, PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { forceReplaceObjectValue, type ForceReplaceObjectValueArgs } from './forceReplaceObjectValue.ts';

export interface ForceSetObjectValueArgs<T, ErrorCodeT extends string> extends ForceReplaceObjectValueArgs<T, ErrorCodeT> {
  create: PRFunc<T | undefined, ErrorCodeT | 'conflict', [initialValue: T]>;
}

/** Forcibly sets the value of an object in a store, even if it doesn't already exist, without concern for potentially clobbering concurrent
 * updates */
export const forceSetObjectValue = makeAsyncResultFunc(
  [import.meta.filename],
  async <T, ErrorCodeT extends string>(
    trace: Trace,
    { getMutable, update, create, maxAttempts }: ForceSetObjectValueArgs<T, ErrorCodeT>,
    newValue: T
  ): PR<undefined, Exclude<ErrorCodeT, 'conflict' | 'not-found' | 'out-of-date'>> => {
    const result = await disableLam('not-found', forceReplaceObjectValue)(trace, { getMutable, update, maxAttempts }, newValue);
    if (!result.ok) {
      if (result.value.errorCode === 'not-found') {
        // If the object doesn't exist, try to create it
        const created = await disableLam('conflict', create)(trace, newValue);
        if (!created.ok) {
          if (created.value.errorCode === 'conflict') {
            // If there's a conflict, it was likely just created, so try to get it again

            const result2 = await forceReplaceObjectValue(trace, { getMutable, update, maxAttempts }, newValue);
            if (!result2.ok) {
              // If it still fails, something else is wrong

              return generalizeFailureResult(trace, result2, 'not-found') as FailureResult<
                Exclude<ErrorCodeT, 'conflict' | 'not-found' | 'out-of-date'>
              >;
            }

            return makeSuccess(undefined);
          }

          return created as FailureResult<Exclude<ErrorCodeT, 'conflict' | 'not-found' | 'out-of-date'>>;
        }

        return makeSuccess(undefined);
      }

      return result as FailureResult<Exclude<ErrorCodeT, 'conflict' | 'not-found' | 'out-of-date'>>;
    }

    return makeSuccess(undefined);
  }
);
