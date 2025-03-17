import { TraceableError } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { StatusCodes } from 'http-status-codes';

export class InternalSchemaValidationError<ErrorCodeT extends string = never> extends TraceableError<ErrorCodeT> {
  constructor(trace: Trace, options?: { cause?: TraceableError<string>; message?: string; errorCode?: ErrorCodeT | 'generic' }) {
    super(trace, 'InternalSchemaValidationError', {
      ...options,
      message: options?.message ?? 'Schema validation failed',
      httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      apiMessage: 'Internal server error',
      logLevel: 'error'
    });
  }
}
