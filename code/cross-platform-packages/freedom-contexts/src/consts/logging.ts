import type { LoggingMode } from 'freedom-logging-types';
import { loggingModes } from 'freedom-logging-types';

import { getEnv, onEnvChange } from '../utils/getEnv.ts';

const computeDefaultLoggingModeFromEnv = (envValue: string | undefined) => loggingModes.checked(envValue ?? '') ?? 'structured';

export let defaultLoggingMode: LoggingMode = computeDefaultLoggingModeFromEnv(
  getEnv('FREEDOM_LOGGING_MODE_DEFAULT', process.env.FREEDOM_LOGGING_MODE_DEFAULT)
);

DEV: {
  onEnvChange('FREEDOM_LOGGING_MODE_DEFAULT', process.env.FREEDOM_LOGGING_MODE_DEFAULT, (envValue) => {
    defaultLoggingMode = computeDefaultLoggingModeFromEnv(envValue);
  });
}
