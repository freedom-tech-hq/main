import type { PR, Result } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { MailId } from 'freedom-email-sync';
import { mailIdInfo } from 'freedom-email-sync';
import type { Mail, MailDraftId, ThreadLikeId } from 'freedom-email-user';
import { getMailById, getMailDraftById, mailDraftIdInfo, mailThreadIdInfo, makeMailFromDraft } from 'freedom-email-user';
import type { TypeOrPromisedType } from 'yaschema';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getOrCreateEmailAccessForUser } from '../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';
import type { GetMailForThread_MailAddedPacket } from '../../types/mail/getMailForThread/GetMailForThread_MailAddedPacket.ts';
import type { GetMailForThreadPacket } from '../../types/mail/getMailForThread/GetMailForThreadPacket.ts';

// const globalCache: Record<MailThreadId, Mail[]> = {};

export const getMailForThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    threadLikeId: ThreadLikeId,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailForThreadPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailForThread_MailAddedPacket> => {
    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'mail-added' as const, mail: [] });
    }

    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    if (mailThreadIdInfo.is(threadLikeId)) {
      return makeFailure(new GeneralError(trace, new Error("MailThreadId isn't supported yet")));
    } else if (mailIdInfo.is(threadLikeId)) {
      const mailId: MailId = threadLikeId;
      const storedMail = await getMailById(trace, access, mailId);
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
          isUnread: true
        }
      ];

      return makeSuccess({ type: 'mail-added' as const, mail });
    } else if (mailDraftIdInfo.is(threadLikeId)) {
      const mailDraftId: MailDraftId = threadLikeId;
      const draftDoc = await getMailDraftById(trace, access, mailDraftId);
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
          isUnread: false
        }
      ];

      return makeSuccess({ type: 'mail-added' as const, mail });
    } else {
      return makeFailure(new GeneralError(trace, new Error(`Unable to process ID: ${threadLikeId as any}`)));
    }
  }
);
