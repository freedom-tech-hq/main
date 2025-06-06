import type { PR, SuccessResult } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, sleep } from 'freedom-async';
import { makeIsoDateTime, ONE_DAY_MSEC, ONE_SEC_MSEC } from 'freedom-basic-data';
import { NotFoundError, UnauthorizedError } from 'freedom-common-errors';
import { clientApi, type DecryptedViewMessage, type MailId } from 'freedom-email-api';
import { generatePseudoWord } from 'pseudo-words';

import { cachedMessagesByDataSetId } from '../../caches/cachedMessagesByDataSetId.ts';
import { useActiveCredential } from '../../contexts/active-credential.ts';
import { makeUserKeysFromEmailCredential } from '../../internal/utils/makeUserKeysFromEmailCredential.ts';
import type { MailMessagesDataSetId } from '../../types/mail/MailMessagesDataSetId.ts';
import { getConfig } from '../config/config.ts';
import { isDemoMode } from '../config/demo-mode.ts';

export const getMail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, dataSetId: MailMessagesDataSetId, mailId: MailId): PR<DecryptedViewMessage, 'not-found'> => {
    DEV: if (isDemoMode()) {
      return await makeDemoModeResult({ mailId });
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeFailure(new UnauthorizedError(trace, { message: 'No active user' }));
    }

    const messageCache = cachedMessagesByDataSetId.get(dataSetId);
    if (messageCache === undefined) {
      return makeFailure(new NotFoundError(trace, { message: `Data set with ID: ${dataSetId} was disconnected`, errorCode: 'not-found' }));
    }

    const message = messageCache.get(mailId);
    if (message === undefined) {
      return makeFailure(new NotFoundError(trace, { message: `No mail item found with ID ${mailId}`, errorCode: 'not-found' }));
    }

    if (!message.encrypted) {
      return makeSuccess(message.value);
    }

    const userKeys = makeUserKeysFromEmailCredential(credential);
    const decrypted = await clientApi.decryptViewMessage(trace, userKeys, message.value);
    if (!decrypted.ok) {
      return decrypted;
    }

    messageCache.set(mailId, { encrypted: false, value: decrypted.value });

    return makeSuccess(decrypted.value);
  }
);

let makeDemoModeResult: (args: { mailId: MailId }) => Promise<SuccessResult<DecryptedViewMessage>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async ({ mailId }) => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  return makeSuccess({
    id: mailId,
    from: [{ name: 'Demo User', address: `demo@${getConfig().defaultEmailDomain}` }],
    to: [{ name: 'Demo User', address: `demo@${getConfig().defaultEmailDomain}` }],
    cc: [],
    subject: Array(Math.floor(Math.random() * 5 + 1))
      .fill(0)
      .map(() => generatePseudoWord())
      .join(' '),
    body: Array(Math.floor(Math.random() * 10 + 1))
      .fill(0)
      .map(generatePseudoParagraph)
      .join('\n\n'),
    date: makeIsoDateTime(new Date(Date.now() - Math.random() * 30 * ONE_DAY_MSEC)),
    updatedAt: makeIsoDateTime(new Date(Date.now() - Math.random() * 30 * ONE_DAY_MSEC)),
    isBodyHtml: false,
    snippet: Array(Math.floor(Math.random() * 200 + 10))
      .fill(0)
      .map(() => generatePseudoWord())
      .join(' ')
      .substring(0, 200)
  });
};

const generatePseudoParagraph = () =>
  Array(Math.floor(Math.random() * 200 + 10))
    .fill(0)
    .map(() => generatePseudoWord())
    .join(' ');
