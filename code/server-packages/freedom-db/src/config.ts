import { defineConfig } from 'freedom-utils/defineConfig';

const testDefaults = {
  STORAGE_ROOT_PATH: ''
};

export type Config = typeof testDefaults;

export const { initConfig, initConfigForTests, getConfig } = defineConfig(testDefaults);
