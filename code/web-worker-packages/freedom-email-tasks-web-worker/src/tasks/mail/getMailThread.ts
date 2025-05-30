import type { PR, SuccessResult } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, sleep, uncheckedResult } from 'freedom-async';
import { ONE_DAY_MSEC, ONE_SEC_MSEC } from 'freedom-basic-data';
import { NotFoundError, UnauthorizedError } from 'freedom-common-errors';
import { mailIdInfo } from 'freedom-email-sync';
import type { MailThread, ThreadLikeId } from 'freedom-email-user';
import { getMailById } from 'freedom-email-user';
import { generatePseudoWord } from 'pseudo-words';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getOrCreateEmailSyncableStore } from '../../internal/tasks/user/getOrCreateEmailSyncableStore.ts';
import { getConfig } from '../config/config.ts';
import { isDemoMode } from '../config/demo-mode.ts';

export const getMailThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, threadId: ThreadLikeId): PR<MailThread, 'not-found'> => {
    DEV: if (isDemoMode()) {
      return await makeDemoModeResult({ threadId });
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeFailure(new UnauthorizedError(trace, { message: 'No active user' }));
    }

    const syncableStore = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

    if (mailIdInfo.is(threadId)) {
      const storedMail = await getMailById(trace, syncableStore, threadId);
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
        numUnread: 1,
        numAttachments: storedMail.value.attachments.length
      });
    }

    return makeFailure(new NotFoundError(trace, { message: `No thread-like item found with ID ${threadId}`, errorCode: 'not-found' }));
  }
);

// Helpers

let makeDemoModeResult: (args: { threadId: ThreadLikeId }) => Promise<SuccessResult<MailThread>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async ({ threadId }: { threadId: ThreadLikeId }) => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  return makeSuccess({
    id: threadId,
    from: `Demo User <demo@${getConfig().defaultEmailDomain}>`,
    to: [`Demo User <demo@${getConfig().defaultEmailDomain}>`],
    subject: Array(Math.floor(Math.random() * 5 + 1))
      .fill(0)
      .map(() => generatePseudoWord())
      .join(' '),
    body: Array(Math.floor(Math.random() * 200 + 10))
      .fill(0)
      .map(() => generatePseudoWord())
      .join(' '),
    timeMSec: Date.now() - Math.random() * 30 * ONE_DAY_MSEC,
    numMessages: Math.floor(Math.random() * 10 + 1),
    numUnread: Math.floor(Math.random() * 2),
    numAttachments: Math.floor(Math.random() * 4)
  });
};
