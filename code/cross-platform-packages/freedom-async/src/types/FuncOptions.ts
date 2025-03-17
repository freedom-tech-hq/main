import type { DisableErrorsForLoggingAndMetrics } from 'freedom-trace-logging-and-metrics';

export interface FuncOptions<ReturnT> {
  /** Specify error types or strings for error codes, to disable conditionally for logging and metrics.  Example:
   * `[UserAuthenticationError, 'username-already-taken']` */
  disableLam?: DisableErrorsForLoggingAndMetrics;

  /** Called when the function is first called */
  onStart?: () => void;
  /** Called if the function encounters a thrown value */
  onError?: (e: any) => void;
  /** Called with the result, if the function completes without throwing */
  onComplete?: (result: ReturnT) => void;
}
