import { once } from 'lodash-es';

export const FORWARDED_ENV = once(
  () =>
    ({
      'process.env.FREEDOM_DEBUG_TOPICS': JSON.stringify(process.env.FREEDOM_DEBUG_TOPICS ?? ''),
      'process.env.FREEDOM_FAILURE_LOGGING': JSON.stringify(process.env.FREEDOM_FAILURE_LOGGING ?? 'false'),
      'process.env.FREEDOM_LOG_ALLOW_BLOCKING': JSON.stringify(process.env.FREEDOM_LOG_ALLOW_BLOCKING ?? 'true'),
      'process.env.FREEDOM_LOG_ARGS': JSON.stringify(process.env.FREEDOM_LOG_ARGS ?? ''),
      'process.env.FREEDOM_LOG_FUNCS': JSON.stringify(process.env.FREEDOM_LOG_FUNCS ?? ''),
      'process.env.FREEDOM_LOG_RESULTS': JSON.stringify(process.env.FREEDOM_LOG_RESULTS ?? ''),
      'process.env.FREEDOM_LOGGING_MODE_DEFAULT': JSON.stringify(process.env.FREEDOM_LOGGING_MODE_DEFAULT ?? ''),
      'process.env.FREEDOM_MAX_CONCURRENCY_DEFAULT': JSON.stringify(process.env.FREEDOM_MAX_CONCURRENCY_DEFAULT ?? '5'),
      'process.env.FREEDOM_PROFILE': JSON.stringify(process.env.FREEDOM_PROFILE ?? ''),
      'process.env.FREEDOM_VERBOSE_LOGGING': JSON.stringify(process.env.FREEDOM_VERBOSE_LOGGING ?? 'false'),
      'process.env.REACT_APP_ENV': JSON.stringify(process.env.REACT_APP_ENV ?? 'production')
    }) satisfies Record<string, string>
);
