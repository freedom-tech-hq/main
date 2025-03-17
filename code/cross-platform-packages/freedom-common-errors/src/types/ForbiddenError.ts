import { TraceableError } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { StatusCodes } from 'http-status-codes';

export class ForbiddenError<ErrorCodeT extends string = never> extends TraceableError<ErrorCodeT> {
  constructor(trace: Trace, options?: { cause?: TraceableError<string>; message?: string; errorCode?: ErrorCodeT | 'generic' }) {
    super(trace, 'ForbiddenError', {
      ...options,
      message: options?.message ?? 'Forbidden',
      httpStatusCode: StatusCodes.FORBIDDEN,
      apiMessage: 'Forbidden',
      logLevel: 'info'
    });
  }
}
