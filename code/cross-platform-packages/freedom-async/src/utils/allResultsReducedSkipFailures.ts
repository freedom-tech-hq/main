import type { Trace } from 'freedom-contexts';

import type { PR } from '../types/PR.ts';
import type { PRFunc } from '../types/PRFunc.ts';
import { makeSuccess } from '../types/Result.ts';
import { allResultsMappedSkipFailures } from './allResultsMappedSkipFailures.ts';
import { makeAsyncResultFunc } from './makeAsyncResultFunc.ts';

/** The reducer isn't called on `undefined` values, since those are presumed to be failures.  Failures from the reducer will always be
 * returned. */
export const allResultsReducedSkipFailures = makeAsyncResultFunc(
  [import.meta.filename],
  async <V, T, ReducedT, ErrorCodeT extends string, SkipErrorCodeT extends ErrorCodeT | 'generic'>(
    trace: Trace,
    values: readonly V[],
    options: {
      _successType?: T;
      _errorCodeType?: ErrorCodeT;
      maxConcurrency?: number;
      skipErrorCodes: Array<SkipErrorCodeT | 'generic'>;
    },
    callback: PRFunc<T, ErrorCodeT, [value: V, index: number]>,
    reducer: PRFunc<ReducedT, Exclude<ErrorCodeT, SkipErrorCodeT>, [out: ReducedT, itemResult: T, itemValue: V, index: number]>,
    initialReduced: ReducedT
  ): PR<ReducedT, Exclude<ErrorCodeT, SkipErrorCodeT>> => {
    const mappedResults = await allResultsMappedSkipFailures(trace, values, options, callback);
    /* node:coverage disable */
    if (!mappedResults.ok) {
      return mappedResults;
    }
    /* node:coverage enable */

    let reduced = initialReduced;
    let index = 0;
    for (const value of values) {
      const resultValue = mappedResults.value[index];
      if (resultValue !== undefined) {
        const newReduced = await reducer(trace, reduced, resultValue, value, index);
        if (!newReduced.ok) {
          return newReduced;
        }
        reduced = newReduced.value;
      }
      index += 1;
    }

    return makeSuccess(reduced);
  }
);
