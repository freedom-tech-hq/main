import type { Trace } from 'freedom-contexts';
import { getTraceStackTop, log, LogJson } from 'freedom-contexts';
import { shouldDisableErrorForLoggingAndMetrics, useLamControl } from 'freedom-trace-logging-and-metrics';
import { once } from 'lodash-es';

import { shouldDebugPerfIssues } from '../config/debug.ts';
import { trackMetrics } from '../config/metrics.ts';
import { ONE_SEC_MSEC } from '../internal/consts/time.ts';
import { argsToStrings, shouldLogFuncArgs } from '../internal/debugging/args.ts';
import { getCallCount } from '../internal/debugging/callCounter.ts';
import { shouldLogFailures, shouldLogFunc } from '../internal/debugging/funcs.ts';
import { resultToString, shouldLogFuncResult } from '../internal/debugging/results.ts';
import type { FuncOptions } from '../types/FuncOptions.ts';

/**
 * Calls an async function, potentially measuring its performance, tracking metrics, and/or logging state/results.
 *
 * @see `shouldDebugPerfIssues`
 */
export const callAsyncFunc = async <ArgsT extends any[], ReturnT>(
  trace: Trace,
  options: FuncOptions<ReturnT>,
  func: (trace: Trace, ...args: ArgsT) => Promise<ReturnT>,
  ...args: ArgsT
): Promise<ReturnT> => {
  const start = performance.now();
  const timeMSec = Date.now();

  const callCount = getCallCount();

  /* node:coverage disable */
  let timeout = shouldDebugPerfIssues()
    ? setTimeout(() => {
        log().debug?.(trace, `[PERF] Not completed after 1s! (call#${callCount})`);
        timeout = setTimeout(() => {
          log().info?.(trace, `[DEADLOCK] Not completed after 30s! (call#${callCount})`);
        }, 29 * ONE_SEC_MSEC);
      }, ONE_SEC_MSEC)
    : undefined;
  /* node:coverage enable */

  let result: Awaited<ReturnT> | undefined;
  let error: Error | undefined;
  let errorCode: 'generic' | undefined;
  const stackTop = once(() => getTraceStackTop(trace));
  let shouldLogForDev = false;
  let shouldLogFailuresForDev = false;
  try {
    DEV: {
      /* node:coverage disable */
      if (shouldLogFunc(trace)) {
        shouldLogForDev = true;
        log().debug?.(trace, 'Starting', stackTop(), `(call#${callCount})`, ...(shouldLogFuncArgs(trace) ? argsToStrings(args) : []));
      } else if (shouldLogFailures(trace)) {
        shouldLogFailuresForDev = true;
      }
      /* node:coverage enable */
    }

    options?.onStart?.();
    result = await func(trace, ...args);
    options?.onComplete?.(result);

    return result;
  } catch (e) {
    try {
      options?.onError?.(e);
    } catch (e2) {
      /* node:coverage ignore next */
      log().error?.(trace, e2);
    }

    error = e instanceof Error ? e : undefined;
    errorCode = 'generic';
    log().error?.(trace, e);
    throw e;
  } finally {
    const stop = performance.now();
    clearTimeout(timeout);

    const durationMSec = stop - start;

    const lamControl = useLamControl(trace);

    /* node:coverage disable */
    if (
      errorCode !== undefined &&
      (shouldDisableErrorForLoggingAndMetrics(options?.disableLam ?? false, { error, errorCode }) ||
        shouldDisableErrorForLoggingAndMetrics(lamControl.disable, { error, errorCode }))
    ) {
      errorCode = undefined;
    }
    /* node:coverage enable */

    trackMetrics()?.(trace, { durationMSec, timeMSec, errorCode });

    DEV: {
      /* node:coverage disable */
      if (shouldLogForDev || (errorCode !== undefined && shouldLogFailuresForDev)) {
        log().debug?.(
          trace,
          `Completed (call#${callCount})`,
          stackTop(),
          ...(errorCode === undefined && shouldLogFuncResult(trace) ? [resultToString(result)] : []),
          new LogJson('durationMSec', durationMSec)
        );
      }
      /* node:coverage enable */
    }
  }
};
