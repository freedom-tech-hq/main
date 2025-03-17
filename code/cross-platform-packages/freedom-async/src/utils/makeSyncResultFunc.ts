import type { Trace } from 'freedom-contexts';
import { makeSubTrace } from 'freedom-contexts';

import type { Result } from '../types/Result.ts';
import type { ResultFuncOptions } from '../types/ResultFuncOptions.ts';
import type { RFunc } from '../types/RFunc.ts';
import { callSyncResultFunc } from './callSyncResultFunc.ts';

/** Makes a sync function that produces a `Result` which, when called, automatically makes a sub-trace from the trace it's called with. */
export const makeSyncResultFunc =
  <ArgsT extends any[], SuccessT, ErrorCodeT extends string = never>(
    idStack: string[],
    func: RFunc<SuccessT, ErrorCodeT, [...args: ArgsT]>,
    options: ResultFuncOptions<SuccessT, ErrorCodeT> = {}
  ) =>
  (trace: Trace, ...args: ArgsT): Result<SuccessT, ErrorCodeT> =>
    callSyncResultFunc(makeSubTrace(trace, idStack), options, func, ...args);
