/* node:coverage disable */

let globalShouldDebugPerfIssues = false;
DEV: if (process.env.FREEDOM_VERBOSE_LOGGING === 'true') {
  globalShouldDebugPerfIssues = true;
}

export const shouldDebugPerfIssues = () => globalShouldDebugPerfIssues;

export const setShouldDebugPerfIssues = (should: boolean) => {
  globalShouldDebugPerfIssues = should;
};
