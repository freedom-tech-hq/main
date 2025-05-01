import type { Trace } from 'freedom-contexts';
import { makeSubTrace } from 'freedom-contexts';

import type { SyncFuncOptions } from '../types/SyncFuncOptions.ts';
import { callSyncFunc } from './callSyncFunc.ts';

/** Makes a sync function which, when called, automatically makes a sub-trace from the trace it's called with. */
export const makeSyncFunc =
  <ArgsT extends any[], ReturnT>(
    idStack: string[],
    func: (trace: Trace, ...args: ArgsT) => ReturnT,
    options: SyncFuncOptions<ReturnT> = {}
  ) =>
  (trace: Trace, ...args: ArgsT): ReturnT =>
    callSyncFunc(makeSubTrace(trace, idStack), options, func, ...args);
