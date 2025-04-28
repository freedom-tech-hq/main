/* node:coverage disable */

import {
  getLogger as getExpressYaschemaApiHandlerLogger,
  setLogger as setExpressYaschemaApiHandlerLogger
} from 'express-yaschema-api-handler';
import { log as defaultLog } from 'freedom-contexts';
import { isEqual } from 'lodash-es';
import type { Logger } from 'yaschema';

let globalLogger: Logger | undefined;

export const log = () => globalLogger ?? defaultLog();

export const setLogger = (logger: Logger) => {
  globalLogger = logger;
  setExpressYaschemaApiHandlerLogger(logger);
};

// If the default logger is still in place for express-yaschema-api-handler, point it to the default logger (from freedom-async)
if (isEqual(getExpressYaschemaApiHandlerLogger(), {})) {
  setExpressYaschemaApiHandlerLogger({
    debug: (...args) => log().debug?.(...args),
    log: (...args) => log().log?.(...args),
    info: (...args) => log().info?.(...args),
    warn: (...args) => log().warn?.(...args),
    error: (...args) => log().error?.(...args)
  });
}
