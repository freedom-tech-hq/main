import type { LoggingMode } from 'freedom-logging-types';
import { loggingModes } from 'freedom-logging-types';

import { devOnEnvChange, getEnv } from '../utils/getEnv.ts';

const computeDefaultLoggingModeFromEnv = (envValue: string | undefined) => loggingModes.checked(envValue ?? '') ?? 'structured';

export let defaultLoggingMode: LoggingMode = computeDefaultLoggingModeFromEnv(
  getEnv('FREEDOM_LOGGING_MODE_DEFAULT', process.env.FREEDOM_LOGGING_MODE_DEFAULT)
);

DEV: {
  devOnEnvChange('FREEDOM_LOGGING_MODE_DEFAULT', process.env.FREEDOM_LOGGING_MODE_DEFAULT, (envValue) => {
    defaultLoggingMode = computeDefaultLoggingModeFromEnv(envValue);
  });
}
