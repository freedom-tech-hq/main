/* node:coverage disable */

import { devMakeEnvDerivative, type Trace } from 'freedom-contexts';

import { makeShouldIncludeTraceForDebuggingFunc } from './makeShouldIncludeTraceForDebuggingFunc.ts';

export let shouldLogFunc: (trace: Trace) => boolean = () => false;
export let shouldLogFailures: (trace: Trace) => boolean = () => false;

DEV: {
  shouldLogFunc = devMakeEnvDerivative('FREEDOM_LOG_FUNCS', process.env.FREEDOM_LOG_FUNCS, (envValue) =>
    makeShouldIncludeTraceForDebuggingFunc(envValue ?? 'all')
  );
  shouldLogFailures = devMakeEnvDerivative('FREEDOM_LOG_FAILURES', process.env.FREEDOM_LOG_FAILURES, (envValue) =>
    makeShouldIncludeTraceForDebuggingFunc(envValue ?? 'all')
  );
}
