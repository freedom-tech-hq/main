/* node:coverage disable */

import { devOnEnvChange, wrapLogger } from 'freedom-contexts';
import type { Logger } from 'yaschema';

let globalLogger: Logger = {};
let globalIsDefaultLogger = true;

export const log = () => globalLogger;
export const setLogger = (logger: Logger) => {
  globalIsDefaultLogger = false;
  globalLogger = logger;
};

export const isDefaultLogger = () => globalIsDefaultLogger;

/** Resets back to the default logger */
export const resetLogger = () => {
  globalLogger = {};
  globalIsDefaultLogger = true;
};

DEV: {
  let loggerByEnvConfig: Logger = globalLogger;

  devOnEnvChange('FREEDOM_VERBOSE_LOGGING', process.env.FREEDOM_VERBOSE_LOGGING, async (envValue) => {
    // Only override own logger. Do not override anything set by an explicit call of setLogger()
    if (globalLogger !== loggerByEnvConfig) {
      return;
    }

    if (envValue === 'true') {
      const newLogger = wrapLogger(console);
      setLogger(newLogger);
    } else {
      resetLogger();
    }

    loggerByEnvConfig = globalLogger;
  });
}
