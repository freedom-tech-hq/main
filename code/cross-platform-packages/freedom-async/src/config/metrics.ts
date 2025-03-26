/* node:coverage disable */

import { getEnv } from 'freedom-contexts';

import { makeShouldIncludeTraceForDebuggingFunc } from '../internal/debugging/makeShouldIncludeTraceForDebuggingFunc.ts';
import type { MetricsTracker } from '../types/MetricsTracker.ts';
import { log } from './logging.ts';

let globalMetricsTracker: MetricsTracker | undefined = undefined;
let globalIsDefaultMetricsTracker = true;

export const trackMetrics = () => globalMetricsTracker;

export const setMetricsTracker = (tracker: MetricsTracker) => {
  globalIsDefaultMetricsTracker = false;
  globalMetricsTracker = tracker;
};

export const isDefaultMetricsTracker = () => globalIsDefaultMetricsTracker;

DEV: if ((getEnv('FREEDOM_PROFILE', process.env.FREEDOM_PROFILE) ?? '') !== '') {
  (async () => {
    const freedomProfiler = await import('freedom-profiler');
    if (isDefaultMetricsTracker()) {
      const shouldTrackFunc = makeShouldIncludeTraceForDebuggingFunc(getEnv('FREEDOM_PROFILE', process.env.FREEDOM_PROFILE));
      setMetricsTracker(freedomProfiler.makeDebugProfiler(log, shouldTrackFunc));
    }
  })();
}
