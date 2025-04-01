/* node:coverage disable */

import { devOnEnvChange } from 'freedom-contexts';

DEV: Error.stackTraceLimit = 1000;

let globalShouldDebugPerfIssues = false;
DEV: devOnEnvChange('FREEDOM_VERBOSE_LOGGING', process.env.FREEDOM_VERBOSE_LOGGING, (envValue) => {
  globalShouldDebugPerfIssues = envValue === 'true';
});

export const shouldDebugPerfIssues = () => globalShouldDebugPerfIssues;

export const setShouldDebugPerfIssues = (should: boolean) => {
  globalShouldDebugPerfIssues = should;
};
