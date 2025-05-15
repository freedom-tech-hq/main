import type { EmailTasksWebWorkerConfig } from 'freedom-email-tasks-web-worker';

import { type AppEnvironment, getAppEnvironment } from '../consts/appEnvironments.ts';
import { dev } from './dev.ts';
import { local } from './local.ts';
import { production } from './production.ts';

export const taskWorkerConfigs: Record<AppEnvironment, EmailTasksWebWorkerConfig> = {
  local,
  dev,
  production
};

export const getTaskWorkerConfig = (appEnv?: AppEnvironment) => taskWorkerConfigs[appEnv ?? getAppEnvironment()];
