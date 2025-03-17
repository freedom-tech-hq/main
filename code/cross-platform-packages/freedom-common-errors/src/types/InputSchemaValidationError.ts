import { TraceableError } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { StatusCodes } from 'http-status-codes';

export class InputSchemaValidationError<ErrorCodeT extends string = never> extends TraceableError<ErrorCodeT> {
  constructor(trace: Trace, options?: { cause?: TraceableError<string>; message?: string; errorCode?: ErrorCodeT | 'generic' }) {
    super(trace, 'InputSchemaValidationError', {
      ...options,
      message: options?.message ?? 'Schema validation failed',
      httpStatusCode: StatusCodes.BAD_REQUEST,
      apiMessage: 'Bad request',
      logLevel: 'debug'
    });
  }
}
