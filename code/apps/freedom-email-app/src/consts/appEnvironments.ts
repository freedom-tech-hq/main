import { getEnv } from 'freedom-contexts';
import { makeStringSubtypeArray } from 'yaschema';

export const appEnvironments = makeStringSubtypeArray('local', 'production');
export type AppEnvironment = (typeof appEnvironments)[0];

export const defaultAppEnvironment: AppEnvironment = 'production';

export const getAppEnvironment = (): AppEnvironment => {
  const discoveredAppEnv = getEnv('REACT_APP_ENV', process.env.REACT_APP_ENV) ?? defaultAppEnvironment;
  return appEnvironments.checked(discoveredAppEnv) ?? defaultAppEnvironment;
};
