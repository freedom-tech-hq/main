import type { PR, Result } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { MailId } from 'freedom-email-sync';
import { mailIdInfo, storedMailSchema } from 'freedom-email-sync';
import type { Mail, MailDraftId, ThreadLikeId } from 'freedom-email-user';
import { getMailDraftById, getUserMailPaths, mailDraftIdInfo, mailThreadIdInfo, makeMailFromDraft } from 'freedom-email-user';
import { getBundleAtPath, getJsonFromFile } from 'freedom-syncable-store-types';
import type { TypeOrPromisedType } from 'yaschema';

import { useActiveUserId } from '../../contexts/active-user-id.ts';
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
    const activeUserId = useActiveUserId(trace);

    if (activeUserId.userId === undefined) {
      return makeSuccess({ type: 'mail-added' as const, mail: [] });
    }

    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, { userId: activeUserId.userId }));

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    const nowDate = new Date();
    const storageYearPath = paths.storage.year(nowDate);

    // TODO: temp this should load progressively backwards
    // TODO: temp this should load IDs from the thread document
    const mailStorageBundle = await getBundleAtPath(trace, userFs, paths.storage.year(nowDate).month.day.hour.value);
    if (!mailStorageBundle.ok) {
      return generalizeFailureResult(trace, mailStorageBundle, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    if (mailThreadIdInfo.is(threadLikeId)) {
      return makeFailure(new GeneralError(trace, new Error("MailThreadId isn't supported yet")));
    } else if (mailIdInfo.is(threadLikeId)) {
      const mailId: MailId = threadLikeId;
      const storedMail = await getJsonFromFile(
        trace,
        userFs,
        (await storageYearPath.month.day.hour.mailId(mailId)).detailed,
        storedMailSchema
      );
      if (!storedMail.ok) {
        return generalizeFailureResult(trace, storedMail, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
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
