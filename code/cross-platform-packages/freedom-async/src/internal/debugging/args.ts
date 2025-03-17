/* node:coverage disable */

import type { Trace } from 'freedom-contexts';

import { genericValueToString } from '../utils/genericValueToString.ts';
import { makeShouldIncludeTraceForDebuggingFunc } from './makeShouldIncludeTraceForDebuggingFunc.ts';

export let shouldLogFuncArgs: (trace: Trace) => boolean = () => false;
export let argsToStrings: (args: any[]) => string[];

DEV: {
  shouldLogFuncArgs = makeShouldIncludeTraceForDebuggingFunc(process.env.FREEDOM_LOG_ARGS);

  argsToStrings = (args) => {
    const out: string[] = ['ARGS:'];

    let index = 0;
    for (const arg of args) {
      out.push(`[${index}]=`);
      out.push(genericValueToString(arg));
      index += 1;
    }

    return out;
  };
}
