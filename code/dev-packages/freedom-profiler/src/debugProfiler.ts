import type { Trace } from 'freedom-contexts';
import { getTraceStackTop } from 'freedom-contexts';
import type { Logger } from 'yaschema';

export const makeDebugProfiler = (log: () => Logger, shouldTrackFunc: (trace: Trace) => boolean) => {
  let totalDurationById: Record<string, number> = {};
  let numCallsById: Record<string, number> = {};

  const flush = () => {
    const top10TotalDurationKeys = Object.keys(totalDurationById)
      .sort((a, b) => totalDurationById[b] - totalDurationById[a])
      .slice(0, 10);
    const top10AvgDurationKeys = Object.keys(totalDurationById)
      .sort((a, b) => totalDurationById[b] / numCallsById[b] - totalDurationById[a] / numCallsById[a])
      .slice(0, 10);
    const top10ByCountKeys = Object.keys(totalDurationById)
      .sort((a, b) => numCallsById[b] - numCallsById[a])
      .slice(0, 10);

    if (top10TotalDurationKeys.length === 0 || top10AvgDurationKeys.length === 0 || top10ByCountKeys.length === 0) {
      return; // Nothing interesting to log
    }

    // Top 10 by total duration
    log().info?.('Top 10 by total duration:');
    log().info?.('----------');
    for (const key of top10TotalDurationKeys) {
      log().info?.(
        `- ${key}: ${totalDurationById[key]}ms (${numCallsById[key]} calls, avg. ${totalDurationById[key] / numCallsById[key]}ms)`
      );
    }
    log().info?.('----------');

    // Top 10 by avg duration
    log().info?.('Top 10 by avg duration:');
    log().info?.('----------');
    for (const key of top10AvgDurationKeys) {
      log().info?.(
        `- ${key}: ${totalDurationById[key] / numCallsById[key]}ms (${numCallsById[key]} calls, total ${totalDurationById[key]}ms)`
      );
    }
    log().info?.('----------');

    // Top 10 by call count
    log().info?.('Top 10 by call count:');
    log().info?.('----------');
    for (const key of top10ByCountKeys) {
      log().info?.(
        `- ${key}: ${numCallsById[key]} (avg. ${totalDurationById[key] / numCallsById[key]}ms, total ${totalDurationById[key]}ms)`
      );
    }
    log().info?.('----------');

    totalDurationById = {};
    numCallsById = {};
  };

  try {
    process.on('beforeExit', () => {
      flush();
    });
  } catch (_e) {
    // Ignoring, process.on is only for Node.js
  }

  const track = (trace: Trace, { durationMSec }: { durationMSec: number; timeMSec: number; errorCode: string | undefined }) => {
    if (!shouldTrackFunc(trace)) {
      return;
    }

    const id = getTraceStackTop(trace);
    totalDurationById[id] = (totalDurationById[id] ?? 0) + durationMSec;
    numCallsById[id] = (numCallsById[id] ?? 0) + 1;
  };

  return { track, flush };
};
