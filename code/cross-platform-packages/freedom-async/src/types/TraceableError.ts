import type { Trace } from 'freedom-contexts';
import { getTraceStack, makeUuid } from 'freedom-contexts';
import { StatusCodes } from 'http-status-codes';
import type { Logger } from 'yaschema';

export interface TraceableErrorOptions<ErrorCodeT extends string = never> {
  cause?: TraceableError<string>;
  message?: string;
  errorCode?: NoInfer<ErrorCodeT> | 'generic';
  httpStatusCode?: number;
  apiMessage?: string;
  logLevel?: keyof Logger;
  jsStack?: string;
}

export abstract class TraceableError<ErrorCodeT extends string = never> extends Error {
  public readonly trace: Trace;
  public readonly type: string;
  public readonly cause?: TraceableError<string>;
  public readonly errorCode: NoInfer<ErrorCodeT> | 'generic';
  /** An HTTP status code that may be appropriate to return via APIs */
  public readonly httpStatusCode: number;
  /** A message that may be appropriate to return via APIs.  No internal data. */
  public readonly apiMessage: string;
  /** The preferred log level to use */
  public readonly logLevel: keyof Logger;
  public readonly jsStack?: string;

  private errorId_ = makeUuid();

  private alreadyLogged_ = false;
  public readonly wasAlreadyLogged = () => this.alreadyLogged_;

  constructor(
    trace: Trace,
    type: string,
    {
      cause,
      message,
      errorCode = 'generic',
      httpStatusCode = StatusCodes.INTERNAL_SERVER_ERROR,
      apiMessage = 'Internal server error',
      logLevel = 'debug',
      jsStack
    }: TraceableErrorOptions<ErrorCodeT> = {}
  ) {
    super(message);
    this.trace = trace;
    this.type = type;
    this.cause = cause;
    this.httpStatusCode = httpStatusCode;
    this.apiMessage = apiMessage;
    this.logLevel = logLevel;
    this.errorCode = errorCode;
    this.jsStack = jsStack ?? this.stack;
  }

  public toString(allowAlreadyLogged = false): string {
    if (!allowAlreadyLogged && this.alreadyLogged_) {
      return `already logged error (${this.errorId_})`;
    }

    try {
      let jsStackPart = '';
      DEV: jsStackPart = (this.jsStack?.length ?? 0) > 0 ? ` ${this.jsStack}` : '';

      const suffix = this.newErrorMessageSuffix() ?? '';
      return `new error [${this.type}] [${this.errorCode ?? 'generic'}] ${this.apiMessage}: ${this.message.replace(/[\r\n]/g, '    ')} at ${getTraceStack(this.trace).join('>')}${
        this.cause !== undefined ? ` caused by ${this.cause.toString(true)}` : ''
      } (${this.errorId_})${jsStackPart}${suffix.length > 0 ? ' ' : ''}${suffix}`;
    } finally {
      this.markAsAlreadyLogged_();
      this.cause?.markAsAlreadyLogged_();
    }
  }

  /** Override to provide additional info in toString for new errors (ignored if `alreadyLogged_` is `true` unless
   * `allowAlreadyLogged = true` is passed to `toString`) */
  protected newErrorMessageSuffix(): string | undefined {
    return undefined;
  }

  private markAsAlreadyLogged_() {
    this.alreadyLogged_ = true;
  }
}
