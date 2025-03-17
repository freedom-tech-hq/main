import { TraceableError } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { StatusCodes } from 'http-status-codes';

export class UnauthorizedError<ErrorCodeT extends string = never> extends TraceableError<ErrorCodeT> {
  constructor(trace: Trace, options?: { cause?: TraceableError<string>; message?: string; errorCode?: ErrorCodeT | 'generic' }) {
    super(trace, 'UnauthorizedError', {
      ...options,
      message: options?.message ?? 'Unauthorized',
      httpStatusCode: StatusCodes.UNAUTHORIZED,
      apiMessage: 'Unauthorized',
      logLevel: 'info'
    });
  }
}
