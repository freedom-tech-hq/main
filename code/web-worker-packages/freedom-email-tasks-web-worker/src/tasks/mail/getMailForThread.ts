import type { PR, Result, SuccessResult } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess, sleep, uncheckedResult } from 'freedom-async';
import { makeIsoDateTime, ONE_DAY_MSEC, ONE_MBYTE, ONE_SEC_MSEC } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import type { MailAttachmentInfo, MailId } from 'freedom-email-sync';
import { mailAttachmentIdInfo, mailIdInfo } from 'freedom-email-sync';
import type { Mail, MailDraftId, ThreadLikeId } from 'freedom-email-user';
import { getMailById, getMailDraftById, mailDraftIdInfo, mailThreadIdInfo, makeMailFromDraft } from 'freedom-email-user';
import { generatePseudoWord } from 'pseudo-words';
import type { TypeOrPromisedType } from 'yaschema';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getOrCreateEmailSyncableStore } from '../../internal/tasks/user/getOrCreateEmailSyncableStore.ts';
import type { GetMailForThread_MailAddedPacket } from '../../types/mail/getMailForThread/GetMailForThread_MailAddedPacket.ts';
import type { GetMailForThreadPacket } from '../../types/mail/getMailForThread/GetMailForThreadPacket.ts';
import { getConfig } from '../config/config.ts';
import { isDemoMode } from '../config/demo-mode.ts';

export const getMailForThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    threadLikeId: ThreadLikeId,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailForThreadPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailForThread_MailAddedPacket> => {
    DEV: if (isDemoMode()) {
      return await makeDemoModeResult();
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'mail-added' as const, mail: [] });
    }

    const syncableStore = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

    if (mailThreadIdInfo.is(threadLikeId)) {
      return makeFailure(new GeneralError(trace, new Error("MailThreadId isn't supported yet")));
    } else if (mailIdInfo.is(threadLikeId)) {
      const mailId: MailId = threadLikeId;
      const storedMail = await getMailById(trace, syncableStore, mailId);
      if (!storedMail.ok) {
        return generalizeFailureResult(trace, storedMail, 'not-found');
      }

      const mail: Mail[] = [
        {
          id: mailId,
          from: storedMail.value.from,
          to: storedMail.value.to,
          subject: storedMail.value.subject,
          body: storedMail.value.body,
          timeMSec: storedMail.value.timeMSec,
          isUnread: true,
          attachments: storedMail.value.attachments
        }
      ];

      return makeSuccess({ type: 'mail-added' as const, mail });
    } else if (mailDraftIdInfo.is(threadLikeId)) {
      const mailDraftId: MailDraftId = threadLikeId;
      const draftDoc = await getMailDraftById(trace, syncableStore, mailDraftId);
      if (!draftDoc.ok) {
        return generalizeFailureResult(trace, draftDoc, ['not-found']);
      }

      const storedMail = makeMailFromDraft(draftDoc.value.document);
      const mail: Mail[] = [
        {
          id: mailDraftId,
          from: storedMail.from,
          to: storedMail.to,
          subject: storedMail.subject,
          body: storedMail.body,
          timeMSec: storedMail.timeMSec,
          isUnread: false,
          attachments: storedMail.attachments
        }
      ];

      return makeSuccess({ type: 'mail-added' as const, mail });
    } else {
      return makeFailure(new GeneralError(trace, new Error(`Unable to process ID: ${threadLikeId as any}`)));
    }
  }
);

let makeDemoModeResult: () => Promise<SuccessResult<GetMailForThread_MailAddedPacket>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async () => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  const randomMimeTypes = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];

  return makeSuccess({
    type: 'mail-added',
    mail: Array(Math.floor(Math.random() * 5 + 1))
      .fill(0)
      .map(() => ({
        id: mailIdInfo.make(`${makeIsoDateTime(new Date(Date.now() - Math.random() * 30 * ONE_DAY_MSEC))}-${makeUuid()}`),
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
        isUnread: Math.random() < 0.5,
        attachments: Array(Math.floor(Math.random() * 4))
          .fill(0)
          .map(
            (): MailAttachmentInfo => ({
              id: mailAttachmentIdInfo.make(`${makeIsoDateTime()}-${makeUuid()}`),
              mimeType: randomMimeTypes[Math.floor(Math.random() * randomMimeTypes.length)],
              numChunks: 1,
              sizeBytes: Math.floor(Math.random() * ONE_MBYTE)
            })
          )
      }))
  });
};
