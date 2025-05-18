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
export const REDIS_LOCK_STORE_PREFIX = env.get('REDIS_LOCK_STORE_PREFIX').required().asString();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Mail Agent

// Note: with synchronous parsing in getFileEnvVar() we are getting clearer error messages. But this schema does not support sync parsing.
// Alternatively, use here serializedSchema and hydrate only on demand
export const MAIL_AGENT_USER_KEYS = await privateCombinationCryptoKeySetSchema.parseAsync(
  getFileEnvVar(env, rootDir, 'MAIL_AGENT_USER_KEYS_', (v) => v)
);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Storage

export const STORAGE_ROOT_PATH = env.getRequiredAsCustom('STORAGE_ROOT_PATH', (value) => resolveConfigPath(rootDir, value));
