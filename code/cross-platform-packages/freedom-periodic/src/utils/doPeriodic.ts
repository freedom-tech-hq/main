import { inline, log, makeAsyncFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';

export type PeriodicEdge = 'leading' | 'trailing';

/** Runs the specified function at the specific interval, either on a leading or trailing edge */
export const doPeriodic = (
  func: (trace: Trace) => Promise<void> | void,
  { intervalMSec, edge }: { intervalMSec: number; edge: PeriodicEdge }
) => {
  const initialIntervalMSec = inline(() => {
    switch (edge) {
      case 'leading':
        return 0;
      case 'trailing':
        return intervalMSec;
    }
  });

  let lastTimeout: ReturnType<typeof setTimeout> | undefined;
  const attempt = makeAsyncFunc([import.meta.filename, 'attempt'], async (trace: Trace) => {
    try {
      await func(trace);
    } catch (e) {
      log().error?.(e);
    }

    if (lastTimeout !== undefined) {
      lastTimeout = setTimeout(() => attempt(makeTrace()), intervalMSec);
    }
  });
  lastTimeout = setTimeout(() => attempt(makeTrace()), initialIntervalMSec);

  return () => {
    if (lastTimeout !== undefined) {
      clearTimeout(lastTimeout);
      lastTimeout = undefined;
    }
  };
};
