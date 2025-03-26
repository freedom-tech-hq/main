import type { Trace } from 'freedom-contexts';

import type { PR } from '../types/PR.ts';
import type { PRFunc } from '../types/PRFunc.ts';
import { makeSuccess } from '../types/Result.ts';
import { allResultsMapped } from './allResultsMapped.ts';
import { makeAsyncResultFunc } from './makeAsyncResultFunc.ts';

export const allResultsReduced = makeAsyncResultFunc(
  [import.meta.filename],
  async <V, T, ReducedT, ErrorCodeT extends string = never>(
    trace: Trace,
    values: readonly V[],
    options: {
      maxConcurrency?: number;
      /** @defaultValue `'continue'` */
      onFailure?: 'continue' | 'stop';
    },
    callback: PRFunc<T, ErrorCodeT, [value: V, index: number]>,
    reducer: PRFunc<ReducedT, never, [out: ReducedT, itemResult: T, itemValue: V, index: number]>,
    initialReduced: ReducedT
  ): PR<ReducedT, ErrorCodeT> => {
    const mappedResults = await allResultsMapped(trace, values, options, callback);
    if (!mappedResults.ok) {
      return mappedResults;
    }

    let reduced = initialReduced;
    let index = 0;
    for (const value of values) {
      const resultValue = mappedResults.value[index];
      const newReduced = await reducer(trace, reduced, resultValue, value, index);
      if (!newReduced.ok) {
        return newReduced;
      }
      reduced = newReduced.value;
      index += 1;
    }

    return makeSuccess(reduced);
  }
);
