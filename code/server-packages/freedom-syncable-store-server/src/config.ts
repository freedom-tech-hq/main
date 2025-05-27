import { defineConfig } from 'freedom-config';

const testDefaults = {
  REDIS_HOST: '127.0.0.1',
  REDIS_PORT: 6379,
  REDIS_PASSWORD: undefined as string | undefined,
  REDIS_PREFIX: 'freedom_test:', // Colon is recognized as a separator by GUI clients

  STORAGE_ROOT_PATH: '' as string | undefined,
  GOOGLE_APPLICATION_CREDENTIALS: undefined as object | undefined,
  GOOGLE_STORAGE_BUCKET: undefined as string | undefined
};

export type Config = typeof testDefaults;

export const { initConfig, initConfigForTests, getConfig } = defineConfig(testDefaults);
