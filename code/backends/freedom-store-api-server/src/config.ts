import fs from 'node:fs';
import path from 'node:path';

import { getFileEnvVar, loadEnv, resolveConfigPath } from 'freedom-config';
import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';

// Load env settings
const rootDir = `${import.meta.dirname}/..`;
const env = loadEnv(rootDir);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Domains

export const CORS_ORIGINS = env.getRequiredAsCustom('CORS_ORIGINS', (value) => value.split(',').map((domain) => domain.trim()));

export const EMAIL_DOMAIN = env.get('EMAIL_DOMAIN').required().asString();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HTTP server

export const PORT = env.get('PORT').required().asPortNumber();

export const HTTPS_SERVER_CERT =
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  (env.get('HTTPS_SERVER_CERT_RAW').asString() ?? '') ||
  env.getAsCustom('HTTPS_SERVER_CERT_PATH', (value) =>
    value.length > 0 ? fs.readFileSync(path.resolve(rootDir, value), 'utf8') : undefined
  );

export const HTTPS_SERVER_KEY =
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  (env.get('HTTPS_SERVER_KEY_RAW').asString() ?? '') ||
  env.getAsCustom('HTTPS_SERVER_KEY_PATH', (value) =>
    value.length > 0 ? fs.readFileSync(path.resolve(rootDir, value), 'utf8') : undefined
  );

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Redis

/** Redis connection details */
export const REDIS_HOST = env.get('REDIS_HOST').required().asString();
export const REDIS_PORT = env.get('REDIS_PORT').required().asPortNumber();
export const REDIS_PASSWORD = env.get('REDIS_PASSWORD').asString();

/** Redis lock store prefix */
export const REDIS_PREFIX = env.get('REDIS_PREFIX').asString() ?? '';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Mail Agent

export const MAIL_AGENT_USER_KEYS = await privateCombinationCryptoKeySetSchema.parseAsync(
  getFileEnvVar(env, rootDir, 'MAIL_AGENT_USER_KEYS_', (v) => v)
);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Storage

// TODO: Make optional when becomes not required by freedom-db
export const STORAGE_ROOT_PATH = env.getRequiredAsCustom('STORAGE_ROOT_PATH', (value) => resolveConfigPath(rootDir, value));

/** GCP access credentials file */
export const GOOGLE_APPLICATION_CREDENTIALS = getFileEnvVar<object | undefined>(
  env,
  rootDir,
  'GOOGLE_APPLICATION_CREDENTIALS_',
  JSON.parse
);

/** Google Cloud Storage bucket for storing emails and user data */
export const GOOGLE_STORAGE_BUCKET = env.get('GOOGLE_STORAGE_BUCKET').asString();

if (STORAGE_ROOT_PATH === undefined && (GOOGLE_APPLICATION_CREDENTIALS === undefined || GOOGLE_STORAGE_BUCKET === undefined)) {
  throw new Error('Need to specify either STORAGE_ROOT_PATH or GOOGLE_APPLICATION_CREDENTIALS+GOOGLE_STORAGE_BUCKET');
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DB

export const PG_HOST = env.get('PG_HOST').required().asString();
export const PG_PORT = env.get('PG_PORT').required().asPortNumber();
export const PG_DATABASE = env.get('PG_DATABASE').required().asString();
export const PG_USER = env.get('PG_USER').required().asString();
export const PG_PASSWORD = env.get('PG_PASSWORD').required().asString();
export const PG_USE_NATIVE = env.get('PG_USE_NATIVE').default('true').asBool();
