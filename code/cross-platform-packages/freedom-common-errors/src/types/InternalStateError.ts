import { TraceableError } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { StatusCodes } from 'http-status-codes';

export class InternalStateError<ErrorCodeT extends string = never> extends TraceableError<ErrorCodeT> {
  constructor(trace: Trace, options?: { cause?: TraceableError<string>; message?: string; errorCode?: ErrorCodeT | 'generic' }) {
    super(trace, 'InternalStateError', {
      ...options,
      message: options?.message ?? 'Internal server error',
      httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      apiMessage: 'Internal server error',
      logLevel: 'warn'
    });
  }
}
