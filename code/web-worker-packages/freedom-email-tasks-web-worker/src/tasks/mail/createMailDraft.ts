import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { MailId } from 'freedom-email-sync';
import { addDraft, type MailDraftId } from 'freedom-email-user';

import { useActiveUserId } from '../../contexts/active-user-id.ts';
import { getOrCreateEmailAccessForUser } from '../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';

export const createMailDraft = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { inReplyToMailId }: { inReplyToMailId?: MailId } = {}): PR<{ draftId: MailDraftId }> => {
    const activeUserId = useActiveUserId(trace);

    if (activeUserId.userId === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'No active user' }));
    }

    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, { userId: activeUserId.userId }));

    const added = await addDraft(trace, access, { inReplyToMailId });
    if (!added.ok) {
      return added;
    }

    return makeSuccess(added.value);
  }
);
