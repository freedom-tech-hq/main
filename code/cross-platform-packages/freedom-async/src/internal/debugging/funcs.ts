/* node:coverage disable */

import { makeEnvDerivative, type Trace } from 'freedom-contexts';

import { makeShouldIncludeTraceForDebuggingFunc } from './makeShouldIncludeTraceForDebuggingFunc.ts';

export let shouldLogFunc: (trace: Trace) => boolean = () => false;
export let shouldLogFailures: (trace: Trace) => boolean = () => false;

DEV: {
  shouldLogFunc = makeEnvDerivative('FREEDOM_LOG_FUNCS', process.env.FREEDOM_LOG_FUNCS, (envValue) =>
    makeShouldIncludeTraceForDebuggingFunc(envValue ?? 'all')
  );
  shouldLogFailures = makeEnvDerivative('FREEDOM_LOG_FAILURES', process.env.FREEDOM_LOG_FAILURES, (envValue) =>
    makeShouldIncludeTraceForDebuggingFunc(envValue ?? 'all')
  );
}
