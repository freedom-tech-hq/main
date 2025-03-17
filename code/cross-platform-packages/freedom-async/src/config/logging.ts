/* node:coverage disable */

import { wrapLogger } from 'freedom-contexts';
import type { Logger } from 'yaschema';

let globalLogger: Logger = {};
let globalIsDefaultLogger = true;

export const log = () => globalLogger;
export const setLogger = (logger: Logger) => {
  globalIsDefaultLogger = false;
  globalLogger = logger;
};
export const isDefaultLogger = () => globalIsDefaultLogger;

DEV: if (process.env.FREEDOM_VERBOSE_LOGGING === 'true') {
  (async () => {
    const console = await import('console');
    const wrappedLogger = wrapLogger(console);
    if (isDefaultLogger()) {
      setLogger(wrappedLogger);
    }

    const testingTools = await import('freedom-testing-tools');
    if (testingTools.isDefaultFailureResultLogger()) {
      testingTools.setFailureResultLogger(wrappedLogger);
    }
  })();
}
