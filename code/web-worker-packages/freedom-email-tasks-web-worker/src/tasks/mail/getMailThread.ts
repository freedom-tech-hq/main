import type { PR, SuccessResult } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, sleep } from 'freedom-async';
import { makeIsoDateTime, ONE_DAY_MSEC, ONE_SEC_MSEC } from 'freedom-basic-data';
import { NotFoundError, UnauthorizedError } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import type { DecryptedThread, MailThreadLikeId } from 'freedom-email-api';
import { clientApi, mailIdInfo } from 'freedom-email-api';
import { generatePseudoWord } from 'pseudo-words';

import { cachedThreadsByDataSetId } from '../../caches/cachedThreadsByDataSetId.ts';
import { useActiveCredential } from '../../contexts/active-credential.ts';
import { makeUserKeysFromEmailCredential } from '../../internal/utils/makeUserKeysFromEmailCredential.ts';
import type { MailThreadsDataSetId } from '../../types/mail/MailThreadsDataSetId.ts';
import { getConfig } from '../config/config.ts';
import { isDemoMode } from '../config/demo-mode.ts';

export const getMailThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, dataSetId: MailThreadsDataSetId, threadLikeId: MailThreadLikeId): PR<DecryptedThread, 'not-found'> => {
    DEV: if (isDemoMode()) {
      return await makeDemoModeResult({ threadLikeId });
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeFailure(new UnauthorizedError(trace, { message: 'No active user' }));
    }

    const threadCache = cachedThreadsByDataSetId.get(dataSetId);
    if (threadCache === undefined) {
      return makeFailure(new NotFoundError(trace, { message: `Data set with ID: ${dataSetId} was disconnected`, errorCode: 'not-found' }));
    }

    const thread = threadCache.get(threadLikeId);
    if (thread === undefined) {
      return makeFailure(
        new NotFoundError(trace, { message: `No thread-like item found with ID ${threadLikeId}`, errorCode: 'not-found' })
      );
    }

    if (!thread.encrypted) {
      return makeSuccess(thread.value);
    }

    const userKeys = makeUserKeysFromEmailCredential(credential);
    const decrypted = await clientApi.decryptThread(trace, userKeys, thread.value);
    if (!decrypted.ok) {
      return decrypted;
    }

    threadCache.set(threadLikeId, { encrypted: false, value: decrypted.value });

    return makeSuccess(decrypted.value);
  }
);

// Helpers

let makeDemoModeResult: (args: { threadLikeId: MailThreadLikeId }) => Promise<SuccessResult<DecryptedThread>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async ({ threadLikeId: threadId }) => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  return makeSuccess({
    id: threadId,
    messageCount: Math.floor(Math.random() * 10 + 1),
    lastMessage: {
      id: mailIdInfo.make(`${makeIsoDateTime(new Date(Date.now() - Math.random() * 30 * ONE_DAY_MSEC))}-${makeUuid()}`),
      hasAttachments: Math.random() < 0.5,
      updatedAt: makeIsoDateTime(),
      from: [{ name: 'Demo User', address: `demo@${getConfig().defaultEmailDomain}` }],
      subject: Array(Math.floor(Math.random() * 5 + 1))
        .fill(0)
        .map(() => generatePseudoWord())
        .join(' '),
      snippet: Array(Math.floor(Math.random() * 200 + 10))
        .fill(0)
        .map(() => generatePseudoWord())
        .join(' ')
        .substring(0, 200)
    }
  });
};
