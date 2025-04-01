/* node:coverage disable */

import type { Trace } from 'freedom-contexts';

import type { PR } from '../types/PR.ts';
import { makeSuccess } from '../types/Result.ts';
import { sleep } from '../utils/sleep.ts';

export const makeDelayedSuccessResult = async <SuccessT, ErrorCodeT extends string = never>(
  _trace: Trace,
  value: SuccessT
): PR<SuccessT, ErrorCodeT> => {
  await sleep(Math.random() * 100);
  return makeSuccess(value);
};
