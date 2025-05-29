import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';

let globalIsDemoMode = false;

export const isDemoMode = () => globalIsDemoMode;

export const setDemoMode = makeAsyncResultFunc([import.meta.filename, 'setDemoMode'], async (_trace, demoMode: boolean): PR<undefined> => {
  globalIsDemoMode = demoMode;

  return makeSuccess(undefined);
});
