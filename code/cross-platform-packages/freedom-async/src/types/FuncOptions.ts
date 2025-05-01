import type { DisableErrorsForLoggingAndMetrics } from 'freedom-trace-logging-and-metrics';
import type { TypeOrPromisedType } from 'yaschema';

export interface FuncOptions<ReturnT, SpecialCallbackReturnT extends TypeOrPromisedType<void> | void> {
  /** Specify error types or strings for error codes, to disable conditionally for logging and metrics.  Example:
   * `[UserAuthenticationError, 'username-already-taken']` */
  disableLam?: DisableErrorsForLoggingAndMetrics;

  /** Called when the function is first called */
  onStart?: () => SpecialCallbackReturnT;
  /** Called if the function encounters a thrown value */
  onError?: (e: any) => SpecialCallbackReturnT;
  /** Called with the result, if the function completes without throwing */
  onComplete?: (result: ReturnT) => SpecialCallbackReturnT;
}
