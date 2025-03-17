import { TraceableError } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { StatusCodes } from 'http-status-codes';

export class NotFoundError<ErrorCodeT extends string = never> extends TraceableError<ErrorCodeT> {
  constructor(trace: Trace, options?: { cause?: TraceableError<string>; message?: string; errorCode?: ErrorCodeT | 'generic' }) {
    super(trace, 'NotFoundError', {
      ...options,
      message: options?.message ?? 'Not found',
      httpStatusCode: StatusCodes.NOT_FOUND,
      apiMessage: 'Not found',
      logLevel: 'debug'
    });
  }
}
