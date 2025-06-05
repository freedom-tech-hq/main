import type { PR, SuccessResult } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess, sleep } from 'freedom-async';
import { makeIsoDateTime, ONE_DAY_MSEC, ONE_SEC_MSEC } from 'freedom-basic-data';
import { UnauthorizedError } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import type { DecryptedThread, MailThreadLikeId } from 'freedom-email-api';
import { mailIdInfo } from 'freedom-email-api';
import { generatePseudoWord } from 'pseudo-words';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getConfig } from '../config/config.ts';
import { isDemoMode } from '../config/demo-mode.ts';

export const getMailThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, threadId: MailThreadLikeId): PR<DecryptedThread, 'not-found'> => {
    DEV: if (isDemoMode()) {
      return await makeDemoModeResult({ threadId });
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeFailure(new UnauthorizedError(trace, { message: 'No active user' }));
    }

    // TODO: implement this method

    // return makeFailure(new NotFoundError(trace, { message: `No thread-like item found with ID ${threadId}`, errorCode: 'not-found' }));
    return makeFailure(new GeneralError(trace, new Error('not implemented yet')));
  }
);

// Helpers

let makeDemoModeResult: (args: { threadId: MailThreadLikeId }) => Promise<SuccessResult<DecryptedThread>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async ({ threadId }) => {
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
