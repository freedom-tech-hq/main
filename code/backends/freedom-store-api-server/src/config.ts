import fs from 'node:fs';
import path from 'node:path';

import { loadEnv, resolveConfigPath } from 'freedom-config';

// Load env settings
const rootDir = `${import.meta.dirname}/..`;
const env = loadEnv(rootDir);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Domains

export const CORS_ORIGINS = env
  .get('CORS_ORIGINS')
  .required()
  .asCustom((value) => value.split(',').map((domain) => domain.trim())) as string[];

export const EMAIL_DOMAIN = env.get('EMAIL_DOMAIN').required().asString();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// HTTP server

export const PORT = env.get('PORT').required().asPortNumber();

export const HTTPS_SERVER_CERT =
  (env.get('HTTPS_SERVER_CERT_RAW').asString() ?? '') ||
  (env.get('HTTPS_SERVER_CERT_PATH').asCustom((value) => value && fs.readFileSync(path.resolve(rootDir, value), 'utf8')) as
    | string
    | undefined);

export const HTTPS_SERVER_KEY =
  (env.get('HTTPS_SERVER_KEY_RAW').asString() ?? '') ||
  (env.get('HTTPS_SERVER_KEY_PATH').asCustom((value) => value && fs.readFileSync(path.resolve(rootDir, value), 'utf8')) as
    | string
    | undefined);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Storage

export const STORAGE_ROOT_PATH = env
  .get('STORAGE_ROOT_PATH')
  .required()
  .asCustom((value) => resolveConfigPath(rootDir, value)) as string;
