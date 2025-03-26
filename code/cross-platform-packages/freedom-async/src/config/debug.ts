/* node:coverage disable */

import { getEnv } from 'freedom-contexts';

DEV: Error.stackTraceLimit = 1000;

let globalShouldDebugPerfIssues = false;
DEV: if (getEnv('FREEDOM_VERBOSE_LOGGING', process.env.FREEDOM_VERBOSE_LOGGING) === 'true') {
  globalShouldDebugPerfIssues = true;
}

export const shouldDebugPerfIssues = () => globalShouldDebugPerfIssues;

export const setShouldDebugPerfIssues = (should: boolean) => {
  globalShouldDebugPerfIssues = should;
};
