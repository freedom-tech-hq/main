export interface ShouldRetryArgs {
  /** `0` for the first failure */
  attemptCount: number;
  /** The sum of all previous `delayMSec` values.  `0` for the first failure */
  accumulatedDelayMSec: number;
  /** The number of milliseconds ago the first attempt was started (measured using `performance.now()`) */
  firstAttemptTimeAgoMSec: number;
}
