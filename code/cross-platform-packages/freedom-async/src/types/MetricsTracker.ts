import type { Trace } from 'freedom-contexts';

export type MetricsTracker = (trace: Trace, args: { durationMSec: number; timeMSec: number; errorCode: string | undefined }) => void;
