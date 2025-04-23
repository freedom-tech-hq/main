/**
 * Environment file loader for Node.js environments
 * This module is NOT compatible with frontend environments
 */

import path from 'node:path';

import { config as originalConfig, type DotenvConfigOptions } from '@dotenvx/dotenvx';

import { from } from './from.ts';

// Prevent esbuild from substituting process with build-time values
const myProcess = process;

/**
 * Fix dotenvx
 *
 * For some reason dotenvx.config() doesn't update process.env, so using a var and explicit merge
 * Same was for dotenv package. Something is with ESM or Node compatibility
 */
function config(options: DotenvConfigOptions) {
  const env = {};
  originalConfig(options);
  process.env = { ...env, ...myProcess.env };
}

/**
 * Loads environment variables from .env files following a specific priority order
 * Priority (highest to lowest):
 * 0. original process env - existing values won't be overridden
 * 1. .env.[NODE_ENV]
 * 2. .env
 * 3. .env.[NODE_ENV].defaults
 * 4. .env.defaults
 *
 * For test environment, only .env.test is loaded
 *
 * @param rootDir The root directory where .env files are located
 * @returns True if at least one .env file was loaded, false otherwise
 */
export function loadEnv(rootDir: string) {
  const nodeEnv = myProcess.env.NODE_ENV || 'development';

  if (nodeEnv === 'test') {
    // For test environment, only load .env.test to have deterministic results
    config({
      path: [path.join(rootDir, '.env.test')],
      strict: true,
      logLevel: 'warn'
    });
  } else {
    // Loading .env files in order of priority (highest to lowest)
    // Existing vars won't be overridden, so xxx.local values override values from xxx file.
    const envFiles = [
      // Excluded from git
      `.env.${nodeEnv}`,
      '.env',

      // Included in git
      `.env.${nodeEnv}.defaults`,
      '.env.defaults'
      // The schema is usually .env + .env.local, but `.env` is often used in deployments
      // So choosing .env.defaults and .env respectively
    ];

    config({
      path: envFiles.map((value) => path.join(rootDir, value)),
      ignore: ['MISSING_ENV_FILE'],
      logLevel: 'info'
    });
  }

  return from(process.env);
}
