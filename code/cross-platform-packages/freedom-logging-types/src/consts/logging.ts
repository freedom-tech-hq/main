import { getEnv } from '../internal/utils/getEnv.ts';
import type { LoggingMode } from '../types/LoggingMode.ts';
import { loggingModes } from '../types/LoggingMode.ts';

export const defaultLoggingMode: LoggingMode =
  loggingModes.checked(getEnv('FREEDOM_LOGGING_MODE_DEFAULT', process.env.FREEDOM_LOGGING_MODE_DEFAULT) ?? '') ?? 'structured';
