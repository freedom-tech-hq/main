/* node:coverage disable */

import { getEnv, type Trace } from 'freedom-contexts';

import { genericValueToString } from '../utils/genericValueToString.ts';
import { makeShouldIncludeTraceForDebuggingFunc } from './makeShouldIncludeTraceForDebuggingFunc.ts';

export let shouldLogFuncResult: (trace: Trace) => boolean = () => false;
export const resultToString = genericValueToString;

DEV: {
  shouldLogFuncResult = makeShouldIncludeTraceForDebuggingFunc(getEnv('FREEDOM_LOG_RESULTS', process.env.FREEDOM_LOG_RESULTS));
}
