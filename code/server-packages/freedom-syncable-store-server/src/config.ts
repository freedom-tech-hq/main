import { defineConfig } from 'freedom-config';

const testDefaults = {
  REDIS_HOST: '127.0.0.1',
  REDIS_PORT: 6379,
  REDIS_PASSWORD: undefined as string | undefined,
  REDIS_LOCK_STORE_PREFIX: 'lock_',

  STORAGE_ROOT_PATH: ''
};

export type Config = typeof testDefaults;

export const { initConfig, initConfigForTests, getConfig } = defineConfig(testDefaults);
