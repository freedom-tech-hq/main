/* node:coverage disable */

import { devOnEnvChange, log } from 'freedom-contexts';

import { makeShouldIncludeTraceForDebuggingFunc } from '../internal/debugging/makeShouldIncludeTraceForDebuggingFunc.ts';
import type { MetricsTracker } from '../types/MetricsTracker.ts';

let globalMetricsTracker: MetricsTracker | undefined = undefined;
let globalIsDefaultMetricsTracker = true;

export const trackMetrics = () => globalMetricsTracker;

export const setMetricsTracker = (tracker: MetricsTracker | undefined) => {
  globalIsDefaultMetricsTracker = false;
  globalMetricsTracker = tracker;
};

export const isDefaultMetricsTracker = () => globalIsDefaultMetricsTracker;

export const resetMetricsTracker = () => {
  globalMetricsTracker = undefined;
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
      const newMetricsTracker = freedomProfiler.makeDebugProfiler(log, shouldTrackFunc);

      setMetricsTracker(newMetricsTracker);
    } else {
      resetMetricsTracker();
    }

    lastMetricsTracker = globalMetricsTracker;
  });
}
