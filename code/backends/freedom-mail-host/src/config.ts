import fs from 'node:fs';
import path from 'node:path';

import { getFileEnvVar, loadEnv, resolveConfigPath } from 'freedom-config';
import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';

// Load env settings
const rootDir = `${import.meta.dirname}/..`;
const env = loadEnv(rootDir);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SMTP server

/** Ports to run the SMTP server on (comma-separated list) */
export const SMTP_PORTS = env.getRequiredAsCustom('SMTP_PORTS', (value) =>
  value.split(',').map((port) => {
    const portNum = parseInt(port.trim(), 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      throw new Error(`Invalid port number: '${port}'`);
    }
    return portNum;
  })
);

/** Host to bind the SMTP server to */
export const SMTP_HOST = env.get('SMTP_HOST').required().asString();

/** Is used to represent us in SMTP protocol. Should be the one with PTR record, same as DEPLOY_DELIVERY_HOST_NAME */
export const SMTP_HOST_NAME = env.get('SMTP_HOST_NAME').required().asString();

/** TLS certificate path for SMTP server */
export const SMTP_TLS_CERT_RAW =
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  (env.get('SMTP_TLS_CERT_RAW').asString() ?? '') ||
  env.getRequiredAsCustom('SMTP_TLS_CERT', (value) => fs.readFileSync(path.resolve(rootDir, value), 'utf8'));

/** TLS key path for SMTP server */
export const SMTP_TLS_KEY_RAW =
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  (env.get('SMTP_TLS_KEY_RAW').asString() ?? '') ||
  env.getRequiredAsCustom('SMTP_TLS_KEY', (value) => fs.readFileSync(path.resolve(rootDir, value), 'utf8'));

/** Maximum email size in bytes */
export const SMTP_MAX_EMAIL_SIZE = env.get('SMTP_MAX_EMAIL_SIZE').required().asInt();

/** Domains we accept mail for */
export const SMTP_OUR_DOMAINS = env.getRequiredAsCustom('SMTP_OUR_DOMAINS', (value) => value.split(',').map((domain) => domain.trim()));

/** Forwarding routes */
export const FORWARDING_ROUTES = JSON.parse(
  // Override the JSON file on deploy
  fs.readFileSync(`${rootDir}/forwardingRoutes.json`, 'utf8')
) as Record<string, string>;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SMTP Upstream (should be on internal network within the same physical machine, thus no auth)

/** Mail upstream SMTP host */
export const SMTP_UPSTREAM_HOST = env.get('SMTP_UPSTREAM_HOST').required().asString();

/** Mail upstream SMTP port */
export const SMTP_UPSTREAM_PORT = env.get('SMTP_UPSTREAM_PORT').default('25').asPortNumber();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Mail Agent

export const MAIL_AGENT_USER_KEYS = await privateCombinationCryptoKeySetSchema.parseAsync(
  getFileEnvVar(env, rootDir, 'MAIL_AGENT_USER_KEYS_', (v) => v)
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
