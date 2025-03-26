/* node:coverage disable */

import { getEnv, wrapLogger } from 'freedom-contexts';
import type { Logger } from 'yaschema';

let globalLogger: Logger = {};
let globalIsDefaultLogger = true;

let globalConsoleLogger: Logger = {};

export const log = () => globalLogger;
export const setLogger = (logger: Logger) => {
  globalIsDefaultLogger = false;
  globalLogger = logger;
};
export const isDefaultLogger = () => globalIsDefaultLogger;

/** Only for test debugging.  This can be used even when `FREEDOM_VERBOSE_LOGGING` isn't set. */
export const consoleLog = () => globalConsoleLogger;

DEV: (async () => {
  const console = await import('console');
  const wrappedLogger = wrapLogger(console);

  globalConsoleLogger = wrappedLogger;

  if (getEnv('FREEDOM_VERBOSE_LOGGING', process.env.FREEDOM_VERBOSE_LOGGING) === 'true') {
    if (isDefaultLogger()) {
      setLogger(wrappedLogger);
    }

    const testingTools = await import('freedom-testing-tools');
    if (testingTools.isDefaultFailureResultLogger()) {
      testingTools.setFailureResultLogger(wrappedLogger);
    }
  }
})();
