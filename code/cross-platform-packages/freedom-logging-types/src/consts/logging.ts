import type { LoggingMode } from '../types/LoggingMode.ts';
import { loggingModes } from '../types/LoggingMode.ts';

export const defaultLoggingMode: LoggingMode = loggingModes.checked(process.env.FREEDOM_LOGGING_MODE_DEFAULT ?? '') ?? 'structured';
