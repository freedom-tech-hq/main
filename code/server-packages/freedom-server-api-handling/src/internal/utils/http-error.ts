import { TraceableError } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { shouldDisableErrorForLoggingAndMetrics, useLamControl } from 'freedom-trace-logging-and-metrics';
import { StatusCodes } from 'http-status-codes';

import { log } from '../../config/logging.ts';
import { metricsCollector } from '../../config/metrics.ts';
import type { FailableWithCodeHttpOutput } from '../types/FailableWithCodeHttpOutput.ts';
import type { GenericallyFailableHttpOutput } from '../types/GenericallyFailableHttpOutput.ts';

/**
 * If the cause is a `TraceableError`, the `httpStatusCode` and `apiMessage` fields are used to generate the response.  The
 * `logLevel` field is used when logging.
 *
 * Otherwise, the cause is logged as if it's an internal server error.
 */
export const httpError = <ErrorCodeT extends string>(
  trace: Trace,
  output: GenericallyFailableHttpOutput | FailableWithCodeHttpOutput<ErrorCodeT>,
  cause: TraceableError<ErrorCodeT>
) => {
  if (cause instanceof TraceableError) {
    const lamControl = useLamControl(trace);

    if (!shouldDisableErrorForLoggingAndMetrics(lamControl.disable, { error: cause, errorCode: cause.errorCode })) {
      log()[cause.logLevel]?.(trace, cause);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return output.failure(cause.httpStatusCode, { body: { message: cause.apiMessage, errorCode: cause.errorCode as any } });
  } /* node:coverage disable */ else {
    log().error?.(trace, cause);
    metricsCollector()?.trackPostCaptureDuration({
      id: 'server:http:internal-server-error',
      timeMSec: Date.now(),
      durationMSec: 0,
      ok: false
    });
    return output.failure(StatusCodes.INTERNAL_SERVER_ERROR, { body: 'Internal server error' });
  } /* node:coverage enable */
};
