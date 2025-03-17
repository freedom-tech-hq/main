import isPromise from 'is-promise';

import type { ChainableResult } from '../types/ChainableResult.ts';
import { makeSuccess } from '../types/Result.ts';

export const resolveChain = <SuccessT, ErrorCodeT extends string = never>(result: ChainableResult<SuccessT, ErrorCodeT>) =>
  isPromise(result) ? result : makeSuccess(result);
