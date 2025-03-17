import type { Trace } from 'freedom-contexts';
import { getTraceStackTop } from 'freedom-contexts';
import { LogJson } from 'freedom-logging-types';
import { shouldDisableErrorForLoggingAndMetrics, useLamControlContext } from 'freedom-trace-logging-and-metrics';
import { once } from 'lodash-es';
import type { Logger } from 'yaschema';

import { shouldDebugPerfIssues } from '../config/debug.ts';
import { log } from '../config/logging.ts';
import { trackMetrics } from '../config/metrics.ts';
import { ONE_SEC_MSEC } from '../internal/consts/time.ts';
import { argsToStrings, shouldLogFuncArgs } from '../internal/debugging/args.ts';
import { getCallCount } from '../internal/debugging/callCounter.ts';
import { shouldLogFunc } from '../internal/debugging/funcs.ts';
import { resultToString, shouldLogFuncResult } from '../internal/debugging/results.ts';
import type { AsyncResultFuncOptions } from '../types/AsyncResultFuncOptions.ts';
import { GeneralError } from '../types/GeneralError.ts';
import type { PR } from '../types/PR.ts';
import type { PRFunc } from '../types/PRFunc.ts';
import type { Result } from '../types/Result.ts';
import type { TraceableError } from '../types/TraceableError.ts';
import { sleep } from './sleep.ts';

/**
 * Calls an async function that produces a `Result`, potentially measuring its performance, tracking metrics, and/or logging state/results.
 *
 * @see `shouldDebugPerfIssues`
 */
export const callAsyncResultFunc = async <ArgsT extends any[], SuccessT, ErrorCodeT extends string = never>(
  trace: Trace,
  options: AsyncResultFuncOptions<SuccessT, ErrorCodeT>,
  func: PRFunc<SuccessT, ErrorCodeT, [...args: ArgsT]>,
  ...args: ArgsT
): PR<SuccessT, ErrorCodeT> => {
  const attempt = async (attemptCount: number) => {
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

    let result: Result<SuccessT, ErrorCodeT> | undefined;
    let error: Error | undefined;
    let errorCode: ErrorCodeT | 'generic' | undefined;
    let errorMessage: (() => string) | undefined;
    let logLevel: keyof Logger = 'debug';
    const stackTop = once(() => getTraceStackTop(trace));
    let shouldLogForDev = false;
    try {
      DEV: {
        /* node:coverage disable */
        if (shouldLogFunc(trace)) {
          shouldLogForDev = true;
          log().debug?.(
            trace,
            'Starting',
            stackTop(),
            `(call#${callCount})`,
            ...(attemptCount > 0 ? [`(retry ${attemptCount})`] : []),
            ...(shouldLogFuncArgs(trace) ? argsToStrings(args) : [])
          );
        }
        /* node:coverage enable */
      }

      options?.onStart?.();
      result = await func(trace, ...args);
      options?.onComplete?.(result);

      if (!result.ok) {
        options?.onFailure?.(result.value);

        error = result.value;
        errorCode = result.value.errorCode ?? 'generic';
        errorMessage = () => (result!.value as TraceableError<ErrorCodeT>).toString();
        logLevel = result.value.wasAlreadyLogged() ? 'debug' : result.value.logLevel;
      } else {
        options?.onSuccess?.(result.value);
      }

      return result;
    } catch (e) {
      try {
        options?.onError?.(e);
      } catch (e2) {
        /* node:coverage ignore next */
        log().error?.(trace, e2);
      }

      try {
        options?.onFailure?.(new GeneralError(trace, e));
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

      const lamControl = useLamControlContext(trace);

      /* node:coverage disable */
      if (
        errorCode !== undefined &&
        (shouldDisableErrorForLoggingAndMetrics(options?.disableLam ?? false, { error, errorCode }) ||
          shouldDisableErrorForLoggingAndMetrics(lamControl.disable, { error, errorCode }))
      ) {
        errorCode = undefined;
        errorMessage = undefined;
      }
      /* node:coverage enable */

      trackMetrics()?.(trace, { durationMSec, timeMSec, errorCode });

      DEV: {
        const logger = log()[logLevel];
        /* node:coverage disable */
        if (logger !== undefined) {
          const jsonLogArgs: LogJson[] = [new LogJson('durationMSec', durationMSec)];
          if (errorCode !== undefined) {
            jsonLogArgs.push(new LogJson('errorCode', errorCode));
          }

          if (shouldLogForDev) {
            logger(
              trace,
              `Completed (call#${callCount})`,
              errorCode === undefined ? 'successfully' : `with ${errorMessage?.() ?? ''}`,
              stackTop(),
              ...(shouldLogFuncResult(trace) ? [resultToString(result?.value)] : []),
              ...(attemptCount > 0 ? [`(retry ${attemptCount})`] : []),
              ...jsonLogArgs
            );
          }
        }
        /* node:coverage enable */
      }
    }
  };

  const shouldRetry = options?.shouldRetry;
  if (shouldRetry !== undefined) {
    // If retrying is potentially supported

    const firstAttemptStart = performance.now();
    let attemptCount = 0;
    let accumulatedDelayMSec = 0;
    while (true) {
      const result = await attempt(attemptCount);
      if (result.ok) {
        return result;
      }

      const { retry, delayMSec = 0 } = options?.shouldRetry?.(result, {
        attemptCount,
        accumulatedDelayMSec,
        firstAttemptTimeAgoMSec: performance.now() - firstAttemptStart
      }) ?? {
        retry: false
      };
      if (!retry) {
        return result;
      }

      await sleep(delayMSec);

      attemptCount += 1;
      accumulatedDelayMSec += delayMSec;
    }
  } else {
    // If retrying isn't supported

    return attempt(0);
  }
};
