import { defineConfig } from 'freedom-utils/defineConfig';

const testDefaults = {
  allStorageRootPath: ''
};

export type Config = typeof testDefaults;

export const { initConfig, initConfigForTests, getConfig } = defineConfig(testDefaults);
