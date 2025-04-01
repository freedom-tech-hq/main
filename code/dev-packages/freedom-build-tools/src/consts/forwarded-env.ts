import { once } from 'lodash-es';

export const FORWARDED_ENV = once(
  () =>
    ({
      'process.env.FREEDOM_BUILD_UUID': JSON.stringify(process.env.FREEDOM_BUILD_UUID ?? ''),
      'process.env.FREEDOM_DEBUG_TOPICS': JSON.stringify(process.env.FREEDOM_DEBUG_TOPICS ?? ''),
      'process.env.FREEDOM_LOG_ARGS': JSON.stringify(process.env.FREEDOM_LOG_ARGS ?? ''),
      'process.env.FREEDOM_LOG_FAILURES': JSON.stringify(process.env.FREEDOM_LOG_FAILURES ?? 'all'),
      'process.env.FREEDOM_LOG_FUNCS': JSON.stringify(process.env.FREEDOM_LOG_FUNCS ?? 'all'),
      'process.env.FREEDOM_LOG_RESULTS': JSON.stringify(process.env.FREEDOM_LOG_RESULTS ?? ''),
      'process.env.FREEDOM_LOGGING_MODE_DEFAULT': JSON.stringify(process.env.FREEDOM_LOGGING_MODE_DEFAULT ?? ''),
      'process.env.FREEDOM_MAX_CONCURRENCY_DEFAULT': JSON.stringify(process.env.FREEDOM_MAX_CONCURRENCY_DEFAULT ?? '5'),
      'process.env.FREEDOM_MOCK_CRYPTO': JSON.stringify(process.env.FREEDOM_MOCK_CRYPTO ?? ''),
      'process.env.FREEDOM_PROFILE': JSON.stringify(process.env.FREEDOM_PROFILE ?? ''),
      'process.env.FREEDOM_VERBOSE_LOGGING': JSON.stringify(process.env.FREEDOM_VERBOSE_LOGGING ?? 'false'),
      'process.env.REACT_APP_ENV': JSON.stringify(process.env.REACT_APP_ENV ?? 'production')
    }) satisfies Record<string, string>
);
