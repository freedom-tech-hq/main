import type { EmailTasksWebWorkerConfig } from 'freedom-email-tasks-web-worker';

import type { AppEnvironment } from '../consts/appEnvironments.ts';
import { local } from './local.ts';
import { production } from './production.ts';

export const taskWorkerConfigs: Record<AppEnvironment, EmailTasksWebWorkerConfig> = {
  local,
  production
};
