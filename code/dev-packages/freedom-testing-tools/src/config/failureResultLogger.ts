/* node:coverage disable */

import { getEnv } from '../internal/utils/getEnv.ts';
import { inline } from '../internal/utils/inline.ts';

type LoggingFunc = (message?: any, ...optionalParams: any[]) => void;

export interface FailureResultLogger {
  error?: LoggingFunc;
}

let globalFailureResultLogger: FailureResultLogger = {
  error: (message?: any, ...optionalParams: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.error('Expected .ok === true, got:', message, ...optionalParams);
  }
};

let globalIsDefaultFailureResultLogger = true;

export const failureResultLogger = () => globalFailureResultLogger;

export const setFailureResultLogger = (logger: FailureResultLogger) => {
  globalIsDefaultFailureResultLogger = false;
  globalFailureResultLogger = logger;
};

export const isDefaultFailureResultLogger = () => globalIsDefaultFailureResultLogger;

DEV: if (getEnv('FREEDOM_FAILURE_LOGGING', process.env.FREEDOM_FAILURE_LOGGING) === 'true') {
  inline(async () => {
    const console = await import('console');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { wrapLogger } = await import('freedom-contexts');
    const wrappedLogger = wrapLogger(console);
    setFailureResultLogger(wrappedLogger);
  });
}
