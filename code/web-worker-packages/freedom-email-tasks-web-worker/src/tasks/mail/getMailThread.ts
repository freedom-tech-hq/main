import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { NotFoundError, UnauthorizedError } from 'freedom-common-errors';
import { mailIdInfo } from 'freedom-email-sync';
import type { MailThread, ThreadLikeId } from 'freedom-email-user';
import { getMailById } from 'freedom-email-user';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getOrCreateEmailAccessForUser } from '../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';

export const getMailThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, threadId: ThreadLikeId): PR<MailThread, 'not-found'> => {
    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeFailure(new UnauthorizedError(trace, { message: 'No active user' }));
    }

    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    if (mailIdInfo.is(threadId)) {
      const storedMail = await getMailById(trace, access, threadId);
      if (!storedMail.ok) {
        return storedMail;
      }

      return makeSuccess({
        id: threadId,
        from: storedMail.value.from,
        to: storedMail.value.to,
        subject: storedMail.value.subject,
        body: storedMail.value.body,
        timeMSec: storedMail.value.timeMSec,
        numMessages: 1,
        numUnread: 1
      });
    }

    return makeFailure(new NotFoundError(trace, { message: `No thread-like item found with ID ${threadId}`, errorCode: 'not-found' }));
  }
);
