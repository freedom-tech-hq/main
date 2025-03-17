import type { MetricTrackingArgs } from './MetricTrackingArgs.ts';
import type { TrackDurationCompletionCallback } from './TrackDurationCompletionCallback.ts';
import type { TrackPostCaptureDurationArgs } from './TrackPostCaptureDurationArgs.ts';

export interface MetricsCollector {
  trackDuration: (args: MetricTrackingArgs) => TrackDurationCompletionCallback | undefined;
  trackImpression: (args: MetricTrackingArgs) => void;
  trackInteraction: (args: MetricTrackingArgs) => void;
  trackPostCaptureDuration: (args: TrackPostCaptureDurationArgs) => void;
}
