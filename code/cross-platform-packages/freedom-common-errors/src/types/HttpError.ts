import { TraceableError } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

export class HttpError<ErrorCodeT extends string = never> extends TraceableError<ErrorCodeT> {
  constructor(
    trace: Trace,
    options?: { status?: number; cause?: TraceableError<string>; message?: string; errorCode?: ErrorCodeT | 'generic' }
  ) {
    super(trace, 'HttpError', {
      ...options,
      message:
        options?.status !== undefined ? `${options?.message ?? 'Http Error'} (${options?.status})` : (options?.message ?? 'Http Error'),
      httpStatusCode: options?.status,
      apiMessage: 'Http Error',
      logLevel: 'debug'
    });
  }
}
