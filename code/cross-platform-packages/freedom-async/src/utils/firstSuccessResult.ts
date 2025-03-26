import type { Trace } from 'freedom-contexts';

import { GeneralError } from '../types/GeneralError.ts';
import type { PR } from '../types/PR.ts';
import type { FailureResult, Result } from '../types/Result.ts';
import { makeFailure } from '../types/Result.ts';
import { inline } from './inline.ts';
import { makeAsyncResultFunc } from './makeAsyncResultFunc.ts';

/** Stops and returns on the first success result.  Otherwise returns the last failure result or an 'empty-data-set' failure if nothing was
 * run. */
export const firstSuccessResult = makeAsyncResultFunc(
  [import.meta.filename],
  async <SuccessT, ErrorCodeT extends string = never>(
    trace: Trace,
    values: Array<PR<SuccessT, ErrorCodeT>>
  ): Promise<Result<SuccessT, ErrorCodeT | 'empty-data-set'>> => {
    if (values.length === 0) {
      return makeFailure(new GeneralError(trace, undefined, 'empty-data-set'));
    }

    return await new Promise<Result<SuccessT, ErrorCodeT>>((resolve) => {
      let failureResult: FailureResult<ErrorCodeT> | undefined;

      let succeeded = false;
      let numComplete = 0;
      for (const value of values) {
        inline(async () => {
          try {
            const result = await value;
            if (result.ok) {
              succeeded = true;
              resolve(result);
              return;
            }

            failureResult = result;
          } finally {
            numComplete += 1;

            if (!succeeded && numComplete === values.length) {
              resolve(failureResult!);
            }
          }
        });
      }
    });
  }
);
