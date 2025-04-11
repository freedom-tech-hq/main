import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { objectEntries } from 'freedom-cast';
import { devSetEnv } from 'freedom-contexts';

export const devFwdEnv = makeAsyncResultFunc([import.meta.filename], async (_trace, env: Partial<Record<string, string>>) => {
  DEV: {
    for (const [key, value] of objectEntries(env)) {
      devSetEnv(key, value);
    }
  }

  return makeSuccess(undefined);
});
