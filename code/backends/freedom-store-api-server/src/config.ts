import fs from 'node:fs';
import path from 'node:path';

import { loadEnv, resolveConfigPath } from 'freedom-config';

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
// Storage

export const STORAGE_ROOT_PATH = env.getRequiredAsCustom('STORAGE_ROOT_PATH', (value) => resolveConfigPath(rootDir, value));
