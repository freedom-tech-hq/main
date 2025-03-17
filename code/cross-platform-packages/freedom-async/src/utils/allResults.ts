import type { Trace } from 'freedom-contexts';

import type { PR } from '../types/PR.ts';
import { makeSuccess } from '../types/Result.ts';
import { makeAsyncResultFunc } from './makeAsyncResultFunc.ts';

/** If all results are ok, returns success with array of results.  Otherwise, returns first failure. */
export const allResults = makeAsyncResultFunc(
  [import.meta.filename],
  async <T, ErrorCodeT extends string = never>(_trace: Trace, values: PR<T, ErrorCodeT>[]): PR<T[], ErrorCodeT> => {
    const resolvedValues = await Promise.all(values);
    const output: T[] = [];
    for (const resolvedValue of resolvedValues) {
      if (!resolvedValue.ok) {
        return resolvedValue;
      }

      output.push(resolvedValue.value);
    }

    return makeSuccess(output);
  }
);
