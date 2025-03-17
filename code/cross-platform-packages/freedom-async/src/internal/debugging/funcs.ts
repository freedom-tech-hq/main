/* node:coverage disable */

import type { Trace } from 'freedom-contexts';

import { makeShouldIncludeTraceForDebuggingFunc } from './makeShouldIncludeTraceForDebuggingFunc.ts';

export let shouldLogFunc: (trace: Trace) => boolean = () => false;

DEV: {
  shouldLogFunc = makeShouldIncludeTraceForDebuggingFunc(process.env.FREEDOM_LOG_FUNCS ?? 'all');
}
