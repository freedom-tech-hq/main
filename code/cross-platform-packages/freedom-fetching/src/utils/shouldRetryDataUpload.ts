import type { FailureResult, ShouldRetryArgs } from 'freedom-async';
import { StatusCodes } from 'http-status-codes';

import { dataUploadExponentialBackoffTimeMSec, MAX_RETRY_DATA_UPLOAD_ACCUMULATED_DELAY_MSEC } from '../consts/retry.ts';

const dataUploadRetryableStatusCodes = new Set([
  StatusCodes.BAD_GATEWAY,
  StatusCodes.GATEWAY_TIMEOUT,
  StatusCodes.INTERNAL_SERVER_ERROR,
  StatusCodes.REQUEST_TIMEOUT,
  StatusCodes.SERVICE_UNAVAILABLE,
  StatusCodes.TOO_MANY_REQUESTS
]);

/**
 * A function that may be passed as the `shouldRetry` option of `retryableFetch`, to determine if data uploads should be retried.
 *
 * With this function, retries are attempted using exponential backoff for any of the following HTTP status codes:
 * - BAD_GATEWAY,
 * - GATEWAY_TIMEOUT,
 * - INTERNAL_SERVER_ERROR,
 * - REQUEST_TIMEOUT,
 * - SERVICE_UNAVAILABLE,
 * - TOO_MANY_REQUESTS
 *
 * Exponential backoff starts with 1s delay and doubles with each attempt, up to a maximum of 32s.  The total accumulated delay is capped at
 * 10 minutes.
 */
export const shouldRetryDataUpload = (failure: FailureResult<any>, { attemptCount, accumulatedDelayMSec }: ShouldRetryArgs) => ({
  retry:
    accumulatedDelayMSec < MAX_RETRY_DATA_UPLOAD_ACCUMULATED_DELAY_MSEC && dataUploadRetryableStatusCodes.has(failure.value.httpStatusCode),
  delayMSec:
    dataUploadExponentialBackoffTimeMSec[attemptCount] ??
    dataUploadExponentialBackoffTimeMSec[dataUploadExponentialBackoffTimeMSec.length - 1] ??
    0
});
