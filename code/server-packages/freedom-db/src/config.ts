import { defineConfig } from 'freedom-config';

const testDefaults = {
  STORAGE_ROOT_PATH: '',
  PG_HOST: 'localhost',
  PG_PORT: 5432,
  PG_DATABASE: 'freedom_1',
  PG_USER: 'freedom_user',
  PG_PASSWORD: 'local-password',
  PG_USE_NATIVE: true
};

export type Config = typeof testDefaults;

export const { initConfig, initConfigForTests, getConfig } = defineConfig(testDefaults);
