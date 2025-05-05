import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { MailId } from 'freedom-email-sync';
import { addMailDraft, type MailDraftId } from 'freedom-email-user';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getOrCreateEmailSyncableStore } from '../../internal/tasks/user/getOrCreateEmailSyncableStore.ts';

export const createMailDraft = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { inReplyToMailId }: { inReplyToMailId?: MailId } = {}): PR<{ draftId: MailDraftId }> => {
    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'No active user' }));
    }

    const syncableStore = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

    const added = await addMailDraft(trace, syncableStore, { inReplyToMailId });
    if (!added.ok) {
      return added;
    }

    return makeSuccess(added.value);
  }
);
