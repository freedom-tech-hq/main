import { getEnv } from 'freedom-contexts';

export const FREEDOM_MAX_CONCURRENCY_DEFAULT = Number(
  getEnv('FREEDOM_MAX_CONCURRENCY_DEFAULT', process.env.FREEDOM_MAX_CONCURRENCY_DEFAULT) ?? 5
);
