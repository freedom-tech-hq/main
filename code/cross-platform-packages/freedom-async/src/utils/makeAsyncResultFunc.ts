import type { Trace } from 'freedom-contexts';
import { makeSubTrace } from 'freedom-contexts';

import type { AsyncResultFuncOptions } from '../types/AsyncResultFuncOptions.ts';
import type { PR } from '../types/PR.ts';
import type { PRFunc } from '../types/PRFunc.ts';
import { callAsyncResultFunc } from './callAsyncResultFunc.ts';

/** Makes an async function that produces a `Result` which, when called, automatically makes a sub-trace from the trace it's called with. */
export const makeAsyncResultFunc =
  <ArgsT extends any[], SuccessT, ErrorCodeT extends string = never>(
    idStack: string[],
    func: PRFunc<SuccessT, ErrorCodeT, [...args: ArgsT]>,
    options: AsyncResultFuncOptions<SuccessT, ErrorCodeT> = {}
  ) =>
  (trace: Trace, ...args: ArgsT): PR<SuccessT, ErrorCodeT> =>
    callAsyncResultFunc(makeSubTrace(trace, idStack), options, func, ...args);
