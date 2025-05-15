import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { MailId, StoredMail } from 'freedom-email-sync';
import { addMailToOutbox } from 'freedom-email-user';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getOrCreateEmailSyncableStore } from '../../internal/tasks/user/getOrCreateEmailSyncableStore.ts';

export const sendMail = makeAsyncResultFunc([import.meta.filename], async (trace, mail: StoredMail): PR<{ mailId: MailId }> => {
  const credential = useActiveCredential(trace).credential;

  if (credential === undefined) {
    return makeFailure(new InternalStateError(trace, { message: 'No active user' }));
  }

  const syncableStore = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

  const added = await addMailToOutbox(trace, syncableStore, mail);
  if (!added.ok) {
    return added;
  }

  return makeSuccess(added.value);
});
