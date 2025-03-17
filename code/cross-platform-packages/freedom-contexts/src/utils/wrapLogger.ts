import type { LoggingMode } from 'freedom-logging-types';
import { LogJson } from 'freedom-logging-types';
import type { Logger } from 'yaschema';

import { wrapLoggingFunc } from './wrapLoggingFunc.ts';

const debugSeverity = new LogJson('severity', 'DEBUG');
const infoSeverity = new LogJson('severity', 'INFO');
const warningSeverity = new LogJson('severity', 'WARNING');
const errorSeverity = new LogJson('severity', 'ERROR');

const shouldAllowLogBlocking = process.env.FREEDOM_LOG_ALLOW_BLOCKING !== 'false';

// If `shouldAllowLogBlocking` is `false`, uses logger.error for all logging, to avoid blocking, so that content is as aligned as possible
export const wrapLogger = (logger: Logger, mode?: LoggingMode): Logger => ({
  debug: wrapLoggingFunc(shouldAllowLogBlocking ? logger.debug : logger.error, { suffix: debugSeverity, mode }),
  log: wrapLoggingFunc(shouldAllowLogBlocking ? logger.log : logger.error, { mode }),
  info: wrapLoggingFunc(shouldAllowLogBlocking ? logger.info : logger.error, { suffix: infoSeverity, mode }),
  warn: wrapLoggingFunc(shouldAllowLogBlocking ? logger.warn : logger.error, { suffix: warningSeverity, mode }),
  error: wrapLoggingFunc(logger.error, { suffix: errorSeverity, mode })
});
