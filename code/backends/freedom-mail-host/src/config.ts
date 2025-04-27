import fs from 'node:fs';
import path from 'node:path';

import { loadEnv, resolveConfigPath } from 'freedom-config';

// Load env settings
const rootDir = `${import.meta.dirname}/..`;
const env = loadEnv(rootDir);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SMTP server

/** Ports to run the SMTP server on (comma-separated list) */
export const SMTP_PORTS = env
  .get('SMTP_PORTS')
  .required()
  .asCustom((value) =>
    value.split(',').map((port) => {
      const portNum = parseInt(port.trim(), 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        throw new Error(`Invalid port number: '${port}'`);
      }
      return portNum;
    })
  ) as number[];

/** Host to bind the SMTP server to */
export const SMTP_HOST = env.get('SMTP_HOST').required().asString();

/** TLS certificate path for SMTP server */
export const SMTP_TLS_CERT_RAW =
  (env.get('SMTP_TLS_CERT_RAW').asString() ?? '') ||
  (env
    .get('SMTP_TLS_CERT')
    .required()
    .asCustom((value) => fs.readFileSync(path.resolve(rootDir, value), 'utf8')) as string);

/** TLS key path for SMTP server */
export const SMTP_TLS_KEY_RAW =
  (env.get('SMTP_TLS_KEY_RAW').asString() ?? '') ||
  (env
    .get('SMTP_TLS_KEY')
    .required()
    .asCustom((value) => fs.readFileSync(path.resolve(rootDir, value), 'utf8')) as string);

/** Maximum email size in bytes */
export const SMTP_MAX_EMAIL_SIZE = env.get('SMTP_MAX_EMAIL_SIZE').required().asInt();

/** Domains we accept mail for */
export const SMTP_OUR_DOMAINS = env
  .get('SMTP_OUR_DOMAINS')
  .required()
  .asCustom((value) => value.split(',').map((domain) => domain.trim())) as string[];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SMTP Upstream (should be on internal network within the same physical machine, thus no auth)

/** Mail upstream SMTP host */
export const SMTP_UPSTREAM_HOST = env.get('SMTP_UPSTREAM_HOST').required().asString();

/** Mail upstream SMTP port */
export const SMTP_UPSTREAM_PORT = env.get('SMTP_UPSTREAM_PORT').default('25').asPortNumber();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Storage

export const STORAGE_ROOT_PATH = env
  .get('STORAGE_ROOT_PATH')
  .required()
  .asCustom((value) => resolveConfigPath(rootDir, value)) as string;

// Temporary disabled in favor of File System Backing and a Docker volume
// /** Google Cloud Storage credentials file contents (not name) */
// export const GOOGLE_APPLICATION_CREDENTIALS_RAW =
//   (env.get('GOOGLE_APPLICATION_CREDENTIALS_RAW').asCustom((value) => (value ? JSON.parse(value) : undefined)) as {} | undefined) ||
//   (env.get('GOOGLE_APPLICATION_CREDENTIALS').asCustom((value) =>
//     value ? JSON.parse(fs.readFileSync(path.resolve(rootDir, value), 'utf8')) : undefined // In GCP, we use machine-wise implicit credentials
//   ) as {} | undefined);
//
// /** Google Cloud Storage bucket for storing emails and user data */
// export const APP_BUCKET = env.get('APP_BUCKET').required().asString();
