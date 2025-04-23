/**
 * Test version of loadEnv that works with fixture files
 */

import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

/**
 * Attempts to load an env file at the specified path
 * @param envPath Path to the env file
 * @returns True if the file was loaded, false otherwise
 */
function tryLoadEnv(envPath: string): boolean {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    return true;
  }
  return false;
}

/**
 * Test version of loadEnv that works with fixture files
 *
 * @param rootDir The root directory where fixture files are located
 * @returns True if at least one env file was loaded, false otherwise
 */
export function testLoadEnv(rootDir: string): boolean {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'test') {
    // For test environment, only load .env.test
    const testEnvPath = path.join(rootDir, `.env.test`);
    dotenv.config({ path: testEnvPath });
    return fs.existsSync(testEnvPath);
  } else {
    let loaded = false;

    // Loading env files in order of priority (highest to lowest)
    const envFiles = [
      `.env.${nodeEnv}.local`,
      `.env.local`,
      `.env.${nodeEnv}`,
      `.env`
    ];

    for (const envFile of envFiles) {
      loaded = tryLoadEnv(path.join(rootDir, envFile)) || loaded;
    }

    if (!loaded) {
      console.warn("Env file hasn't been loaded");
    }

    return loaded;
  }
}
