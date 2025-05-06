import type { Trace } from 'freedom-contexts';
import { get } from 'lodash-es';

import { TraceableError } from './TraceableError.ts';

export class GeneralError<ErrorCodeT extends string = never> extends TraceableError<ErrorCodeT> {
  public readonly originalThrown: any;

  constructor(trace: Trace, originalThrown: any, errorCode?: ErrorCodeT | 'generic') {
    super(trace, 'GeneralError', {
      /* node:coverage ignore next */
      message: originalThrown instanceof Error ? originalThrown.message : 'Error',
      logLevel: 'warn',
      errorCode
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.originalThrown = originalThrown;
  }

  protected override newErrorMessageSuffix(): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const stack = get(this.originalThrown, 'stack');
    if (typeof stack === 'string') {
      return stack;
    }

    return undefined;
  }
}
