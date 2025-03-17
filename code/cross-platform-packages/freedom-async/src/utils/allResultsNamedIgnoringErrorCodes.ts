import type { Trace } from 'freedom-contexts';

import type { PR } from '../types/PR.ts';
import type { FailureResult } from '../types/Result.ts';
import { makeSuccess } from '../types/Result.ts';
import type { InferAllResultsNamedRecordType } from './allResultsNamed.ts';
import { makeAsyncResultFunc } from './makeAsyncResultFunc.ts';

/** If all results are ok, returns success with record of results.  Otherwise, returns first failure. */
export const allResultsNamedIgnoringErrorCodes = makeAsyncResultFunc(
  [import.meta.filename],
  async <
    V extends Record<string, PR<T, ErrorCodeT> | undefined>,
    T,
    IgnoreErrorCodeT extends ErrorCodeT | 'generic',
    ErrorCodeT extends string = never
  >(
    _trace: Trace,
    {
      ignoreErrorCodes
    }: {
      _successType?: T;
      _errorCodeType?: ErrorCodeT;
      ignoreErrorCodes: IgnoreErrorCodeT[];
    },
    values: V
  ): PR<Partial<InferAllResultsNamedRecordType<V, T, ErrorCodeT>>, Exclude<ErrorCodeT, IgnoreErrorCodeT>> => {
    const ignoreErrorCodesSet = new Set<string>(ignoreErrorCodes);

    const entries = Object.entries(values);
    const resolvedValues = await Promise.all(entries.map((entry) => entry[1]));
    const output: Partial<InferAllResultsNamedRecordType<V, T, ErrorCodeT>> = {};
    let index = 0;
    for (const resolvedValue of resolvedValues) {
      if (resolvedValue === undefined) {
        index += 1;
        continue;
      }

      const key = entries[index][0];

      if (!resolvedValue.ok) {
        if (!ignoreErrorCodesSet.has(resolvedValue.value.errorCode ?? 'generic')) {
          return resolvedValue as FailureResult<Exclude<ErrorCodeT, IgnoreErrorCodeT>>;
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        output[key as keyof typeof output] = resolvedValue.value as any;
      }

      index += 1;
    }

    return makeSuccess(output);
  }
);
