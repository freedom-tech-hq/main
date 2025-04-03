/* node:coverage disable */

import type { Trace } from 'freedom-contexts';

import { GeneralError } from '../types/GeneralError.ts';
import type { PR } from '../types/PR.ts';
import { makeFailure } from '../types/Result.ts';
import { sleep } from '../utils/sleep.ts';

export const makeDelayedFailureResult = async <SuccessT, ErrorCodeT extends string = never>(
  trace: Trace,
  errorCode: NoInfer<ErrorCodeT> | 'generic'
): PR<SuccessT, ErrorCodeT> => {
  await sleep(Math.random() * 100);
  return makeFailure(new GeneralError(trace, new Error('something went wrong'), errorCode));
};
