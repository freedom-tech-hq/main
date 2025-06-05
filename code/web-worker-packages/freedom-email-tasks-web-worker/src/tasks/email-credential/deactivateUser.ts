import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';

import { useActiveCredential } from '../../contexts/active-credential.ts';

export const deactivateUser = makeAsyncResultFunc([import.meta.filename], async (trace): PR<undefined> => {
  const activeCredential = useActiveCredential(trace);

  activeCredential.credential = undefined;

  return makeSuccess(undefined);
});
