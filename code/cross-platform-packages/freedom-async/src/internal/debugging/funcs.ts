/* node:coverage disable */

import { getEnv, type Trace } from 'freedom-contexts';

import { makeShouldIncludeTraceForDebuggingFunc } from './makeShouldIncludeTraceForDebuggingFunc.ts';

export let shouldLogFunc: (trace: Trace) => boolean = () => false;

DEV: {
  shouldLogFunc = makeShouldIncludeTraceForDebuggingFunc(getEnv('FREEDOM_LOG_FUNCS', process.env.FREEDOM_LOG_FUNCS) ?? 'all');
}
