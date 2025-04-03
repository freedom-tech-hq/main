import fs from 'node:fs';
import path from 'node:path';

import { loadEnv } from './modules/freedom-config/exports.ts';

// Load env settings
const rootDir = `${import.meta.dirname}/..`;
const env = loadEnv(rootDir);

/**
 * HTTP server
 */

/** Port to run the server on */
export const PORT = env.get('PORT').default('3000').asPortNumber();

/** Host to bind the server to */
export const HOST = '0.0.0.0';

/**
 * Storage
 */

/** Google Cloud Storage credentials file contents (not name) */
export const GOOGLE_APPLICATION_CREDENTIALS_RAW = env.get('GOOGLE_APPLICATION_CREDENTIALS')
  .asCustom((value) => (value
    ? JSON.parse(fs.readFileSync(path.join(rootDir, value), 'utf8'))
    : undefined // In GCP, we use machine-wise implicit credentials
  )) as {} | undefined;

/** Google Cloud Storage bucket for storing emails and user data */
export const APP_BUCKET = env.get('APP_BUCKET').required().asString();

/** Path to the users database file */
export const USERS_FILE = 'users.json';
