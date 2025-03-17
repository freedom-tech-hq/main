import type { MetricTrackingArgs } from './MetricTrackingArgs.ts';

export interface TrackPostCaptureDurationArgs extends MetricTrackingArgs {
  timeMSec: number;
  durationMSec: number;
  ok: boolean;
}
