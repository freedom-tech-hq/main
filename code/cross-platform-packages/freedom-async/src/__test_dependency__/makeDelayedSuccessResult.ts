/* node:coverage disable */

import type { Trace } from 'freedom-contexts';
import { sleep } from 'freedom-testing-tools';

import type { PR } from '../types/PR.ts';
import { makeSuccess } from '../types/Result.ts';

export const makeDelayedSuccessResult = async <SuccessT, ErrorCodeT extends string = never>(
  _trace: Trace,
  value: SuccessT
): PR<SuccessT, ErrorCodeT> => {
  await sleep(Math.random() * 100);
  return makeSuccess(value);
};
