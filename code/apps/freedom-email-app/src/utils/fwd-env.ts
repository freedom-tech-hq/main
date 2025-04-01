import { devSetEnv } from 'freedom-contexts';

DEV: try {
  devSetEnv('FREEDOM_BUILD_UUID', process.env.FREEDOM_BUILD_UUID);
  devSetEnv('FREEDOM_DEBUG_TOPICS', process.env.FREEDOM_DEBUG_TOPICS);
  devSetEnv('FREEDOM_LOG_ARGS', process.env.FREEDOM_LOG_ARGS);
  devSetEnv('FREEDOM_LOG_FAILURES', process.env.FREEDOM_LOG_FAILURES);
  devSetEnv('FREEDOM_LOG_FUNCS', process.env.FREEDOM_LOG_FUNCS);
  devSetEnv('FREEDOM_LOG_RESULTS', process.env.FREEDOM_LOG_RESULTS);
  devSetEnv('FREEDOM_LOGGING_MODE_DEFAULT', process.env.FREEDOM_LOGGING_MODE_DEFAULT);
  devSetEnv('FREEDOM_MAX_CONCURRENCY_DEFAULT', process.env.FREEDOM_MAX_CONCURRENCY_DEFAULT);
  devSetEnv('FREEDOM_MOCK_CRYPTO', process.env.FREEDOM_MOCK_CRYPTO);
  devSetEnv('FREEDOM_PROFILE', process.env.FREEDOM_PROFILE);
  devSetEnv('FREEDOM_VERBOSE_LOGGING', process.env.FREEDOM_VERBOSE_LOGGING);
  devSetEnv('REACT_APP_ENV', process.env.REACT_APP_ENV);
} catch (_e) {
  // Ignoring errors
}
