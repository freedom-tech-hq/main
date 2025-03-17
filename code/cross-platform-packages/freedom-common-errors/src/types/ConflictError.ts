import { TraceableError } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { StatusCodes } from 'http-status-codes';

export class ConflictError<ErrorCodeT extends string = never> extends TraceableError<ErrorCodeT> {
  constructor(trace: Trace, options?: { cause?: TraceableError<string>; message?: string; errorCode?: ErrorCodeT | 'generic' }) {
    super(trace, 'ConflictError', {
      ...options,
      message: options?.message ?? 'Conflict',
      httpStatusCode: StatusCodes.CONFLICT,
      apiMessage: 'Conflict',
      logLevel: 'debug'
    });
  }
}
