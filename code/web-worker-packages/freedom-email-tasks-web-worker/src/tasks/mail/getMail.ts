import type { PR, SuccessResult } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess, sleep } from 'freedom-async';
import { makeIsoDateTime, ONE_DAY_MSEC, ONE_SEC_MSEC } from 'freedom-basic-data';
import { UnauthorizedError } from 'freedom-common-errors';
import type { DecryptedViewMessage, MailId } from 'freedom-email-api';
import { generatePseudoWord } from 'pseudo-words';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getConfig } from '../config/config.ts';
import { isDemoMode } from '../config/demo-mode.ts';

export const getMail = makeAsyncResultFunc([import.meta.filename], async (trace, mailId: MailId): PR<DecryptedViewMessage> => {
  DEV: if (isDemoMode()) {
    return await makeDemoModeResult({ mailId });
  }

  const credential = useActiveCredential(trace).credential;

  if (credential === undefined) {
    return makeFailure(new UnauthorizedError(trace, { message: 'No active user' }));
  }

  // TODO: implement this method

  // return makeFailure(new NotFoundError(trace, { message: `No mail item found with ID ${mailId}`, errorCode: 'not-found' }));
  return makeFailure(new GeneralError(trace, new Error('not implemented yet')));
});

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
  } satisfies DecryptedViewMessage);
};

const generatePseudoParagraph = () =>
  Array(Math.floor(Math.random() * 200 + 10))
    .fill(0)
    .map(() => generatePseudoWord())
    .join(' ');
