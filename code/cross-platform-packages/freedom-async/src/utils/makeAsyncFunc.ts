import type { Trace } from 'freedom-contexts';
import { makeSubTrace } from 'freedom-contexts';

import type { AsyncFuncOptions } from '../types/AsyncFuncOptions.ts';
import { callAsyncFunc } from './callAsyncFunc.ts';

/** Makes an async function which, when called, automatically makes a sub-trace from the trace it's called with. */
export const makeAsyncFunc =
  <ArgsT extends any[], ReturnT>(
    idStack: string[],
    func: (trace: Trace, ...args: ArgsT) => Promise<ReturnT>,
    options: AsyncFuncOptions<ReturnT> = {}
  ) =>
  (trace: Trace, ...args: ArgsT): Promise<ReturnT> =>
    callAsyncFunc(makeSubTrace(trace, idStack), options, func, ...args);
