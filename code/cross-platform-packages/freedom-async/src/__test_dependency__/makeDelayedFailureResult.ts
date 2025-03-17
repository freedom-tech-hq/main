/* node:coverage disable */

import type { Trace } from 'freedom-contexts';
import { sleep } from 'freedom-testing-tools';

import { GeneralError } from '../types/GeneralError.ts';
import type { PR } from '../types/PR.ts';
import { makeFailure } from '../types/Result.ts';

export const makeDelayedFailureResult = async <SuccessT, ErrorCodeT extends string = never>(
  trace: Trace,
  errorCode: NoInfer<ErrorCodeT> | 'generic'
): PR<SuccessT, ErrorCodeT> => {
  await sleep(Math.random() * 100);
  return makeFailure(new GeneralError(trace, new Error('something went wrong'), errorCode));
};
