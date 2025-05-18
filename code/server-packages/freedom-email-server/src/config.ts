import { defineConfig } from 'freedom-config';
import { type PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';

const testDefaults = {
  get MAIL_AGENT_USER_KEYS(): PrivateCombinationCryptoKeySet {
    throw new Error('Set MAIL_AGENT_USER_KEYS with initConfigForTests(). Use __tests__/fixtures/mailAgent.keys.json');
  }
};

export type Config = typeof testDefaults;

export const { initConfig, initConfigForTests, getConfig } = defineConfig(testDefaults);
