/* node:coverage disable */

import { devOnEnvChange, log } from 'freedom-contexts';

import { makeShouldIncludeTraceForDebuggingFunc } from '../internal/debugging/makeShouldIncludeTraceForDebuggingFunc.ts';
import type { MetricsTracker } from '../types/MetricsTracker.ts';

let globalMetricsTracker: MetricsTracker | undefined = undefined;
let globalMetricsFlusher: (() => void) | undefined = undefined;
let globalIsDefaultMetricsTracker = true;

export const trackMetrics = () => globalMetricsTracker;
export const flushMetrics = () => globalMetricsFlusher;

export const setMetricsTracker = ({ track, flush }: { track: MetricsTracker | undefined; flush: () => void }) => {
  globalIsDefaultMetricsTracker = false;
  globalMetricsTracker = track;
  globalMetricsFlusher = flush;
};

export const isDefaultMetricsTracker = () => globalIsDefaultMetricsTracker;

export const resetMetricsTracker = () => {
  globalMetricsTracker = undefined;
  globalMetricsFlusher = undefined;
  globalIsDefaultMetricsTracker = true;
};

DEV: {
  let lastMetricsTracker: MetricsTracker | undefined = globalMetricsTracker;

  devOnEnvChange('FREEDOM_PROFILE', process.env.FREEDOM_PROFILE, async (envValue) => {
    if (globalMetricsTracker !== lastMetricsTracker) {
      return;
    }

    if (envValue !== '') {
      const freedomProfiler = await import('freedom-profiler');
      const shouldTrackFunc = makeShouldIncludeTraceForDebuggingFunc(envValue);

      setMetricsTracker(freedomProfiler.makeDebugProfiler(log, shouldTrackFunc));
    } else {
      resetMetricsTracker();
    }

    lastMetricsTracker = globalMetricsTracker;
  });
}
