/* node:coverage disable */

import { onEnvChange } from 'freedom-contexts';

DEV: Error.stackTraceLimit = 1000;

let globalShouldDebugPerfIssues = false;
DEV: onEnvChange('FREEDOM_VERBOSE_LOGGING', process.env.FREEDOM_VERBOSE_LOGGING, (envValue) => {
  globalShouldDebugPerfIssues = envValue === 'true';
});

export const shouldDebugPerfIssues = () => globalShouldDebugPerfIssues;

export const setShouldDebugPerfIssues = (should: boolean) => {
  globalShouldDebugPerfIssues = should;
};
