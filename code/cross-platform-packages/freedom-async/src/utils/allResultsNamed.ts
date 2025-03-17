import type { Trace } from 'freedom-contexts';

import type { PR } from '../types/PR.ts';
import type { InferResultSuccessT } from '../types/Result.ts';
import { makeSuccess } from '../types/Result.ts';
import { makeAsyncResultFunc } from './makeAsyncResultFunc.ts';

export type InferAllResultsNamedRecordType<
  V extends Record<string, PR<T, ErrorCodeT> | undefined>,
  T,
  ErrorCodeT extends string = never
> = {
  [K in keyof V]: undefined extends V[K] ? InferResultSuccessT<Awaited<Required<V[K]>>> | undefined : InferResultSuccessT<Awaited<V[K]>>;
};

/** If all results are ok, returns success with record of results.  Otherwise, returns first failure. */
export const allResultsNamed = makeAsyncResultFunc(
  [import.meta.filename],
  async <V extends Record<string, PR<T, ErrorCodeT> | undefined>, T, ErrorCodeT extends string = never>(
    _trace: Trace,
    _options: { _successType?: T; _errorCodeType?: ErrorCodeT },
    values: V
  ): PR<InferAllResultsNamedRecordType<V, T, ErrorCodeT>, ErrorCodeT> => {
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
        return resolvedValue;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      output[key as keyof typeof output] = resolvedValue.value as any;

      index += 1;
    }

    return makeSuccess(output as InferAllResultsNamedRecordType<V, T, ErrorCodeT>);
  }
);
