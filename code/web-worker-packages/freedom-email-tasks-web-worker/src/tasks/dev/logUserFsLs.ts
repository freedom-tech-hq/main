import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { logLs } from 'freedom-syncable-store';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getOrCreateEmailSyncableStore } from '../../internal/tasks/user/getOrCreateEmailSyncableStore.ts';

export const logUserFsLs = makeAsyncResultFunc([import.meta.filename], async (trace): PR<undefined> => {
  const credential = useActiveCredential(trace).credential;

  if (credential === undefined) {
    return makeSuccess(undefined);
  }

  const store = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

  await logLs(trace, store, console.log, { prefix: 'user fs: ' });

  return makeSuccess(undefined);
});
