import { setEnv } from 'freedom-contexts';

try {
  setEnv('FREEDOM_BUILD_UUID', process.env.FREEDOM_BUILD_UUID);
  setEnv('FREEDOM_DEBUG_TOPICS', process.env.FREEDOM_DEBUG_TOPICS);
  setEnv('FREEDOM_LOG_ARGS', process.env.FREEDOM_LOG_ARGS);
  setEnv('FREEDOM_LOG_FAILURES', process.env.FREEDOM_LOG_FAILURES);
  setEnv('FREEDOM_LOG_FUNCS', process.env.FREEDOM_LOG_FUNCS);
  setEnv('FREEDOM_LOG_RESULTS', process.env.FREEDOM_LOG_RESULTS);
  setEnv('FREEDOM_LOGGING_MODE_DEFAULT', process.env.FREEDOM_LOGGING_MODE_DEFAULT);
  setEnv('FREEDOM_MAX_CONCURRENCY_DEFAULT', process.env.FREEDOM_MAX_CONCURRENCY_DEFAULT);
  setEnv('FREEDOM_PROFILE', process.env.FREEDOM_PROFILE);
  setEnv('FREEDOM_VERBOSE_LOGGING', process.env.FREEDOM_VERBOSE_LOGGING);
  setEnv('REACT_APP_ENV', process.env.REACT_APP_ENV);
} catch (_e) {
  // Ignoring errors
}
