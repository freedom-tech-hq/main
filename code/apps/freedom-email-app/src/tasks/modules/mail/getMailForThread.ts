import type { PR, Result } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { MailId } from 'freedom-email-sync';
import { mailIdInfo, storedMailSchema } from 'freedom-email-sync';
import type { MailDraftId } from 'freedom-email-user';
import { getMailDraftById, getUserMailPaths, mailDraftIdInfo } from 'freedom-email-user';
import { getBundleAtPath, getJsonFromFile } from 'freedom-syncable-store-types';
import type { TypeOrPromisedType } from 'yaschema';

import type { Mail } from '../../../modules/mail-types/Mail.ts';
import { mailThreadIdInfo } from '../../../modules/mail-types/MailThreadId.ts';
import type { ThreadLikeId } from '../../../modules/mail-types/ThreadLikeId.ts';
import { useActiveUserId } from '../../contexts/active-user-id.ts';
import { getOrCreateEmailAccessForUser } from '../internal/user/getOrCreateEmailAccessForUser.ts';

export interface GetMailForThread_MailAddedPacket {
  readonly type: 'mail-added';
  readonly mail: Mail[];
}

export interface GetMailForThread_MailRemovedPacket {
  readonly type: 'mail-removed';
  readonly ids: MailId[];
}

export type GetMailForThreadPacket = GetMailForThread_MailAddedPacket | GetMailForThread_MailRemovedPacket;

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
    const mailStorageBundle = await getBundleAtPath(trace, userFs, paths.storage.year(nowDate).month.date.hour.value);
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
        (await storageYearPath.month.date.hour.mailId(mailId)).detailed,
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

      const mail: Mail[] = [
        {
          id: mailDraftId,
          from: 'testing@freedommail.me',
          to: draftDoc.value.document.to.getString(),
          subject: draftDoc.value.document.subject.getString(),
          body: draftDoc.value.document.body.getString(),
          timeMSec: 0,
          isUnread: false
        }
      ];

      return makeSuccess({ type: 'mail-added' as const, mail });
    } else {
      return makeFailure(new GeneralError(trace, new Error(`Unable to process ID: ${threadLikeId as any}`)));
    }
  }
);
