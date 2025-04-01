import type { LoggingMode } from 'freedom-logging-types';
import { LogJson } from 'freedom-logging-types';
import type { Logger } from 'yaschema';

import { wrapLoggingFunc } from './wrapLoggingFunc.ts';

const debugSeverity = new LogJson('severity', 'DEBUG');
const infoSeverity = new LogJson('severity', 'INFO');
const warningSeverity = new LogJson('severity', 'WARNING');
const errorSeverity = new LogJson('severity', 'ERROR');

// If `shouldAllowLogBlocking` is `false`, uses logger.error for all logging, to avoid blocking, so that content is as aligned as possible
export const wrapLogger = (logger: Logger, mode?: LoggingMode): Logger => ({
  debug: wrapLoggingFunc(logger.debug, { suffix: debugSeverity, mode }),
  log: wrapLoggingFunc(logger.log, { mode }),
  info: wrapLoggingFunc(logger.info, { suffix: infoSeverity, mode }),
  warn: wrapLoggingFunc(logger.warn, { suffix: warningSeverity, mode }),
  error: wrapLoggingFunc(logger.error, { suffix: errorSeverity, mode })
});
