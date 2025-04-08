import type { PR, Result } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { MailId, StoredMail } from 'freedom-email-sync';
import { mailIdInfo, storedMailSchema } from 'freedom-email-sync';
import { getUserMailPaths } from 'freedom-email-user';
import { extractUnmarkedSyncableId } from 'freedom-sync-types';
import { getBundleAtPath, getJsonFromFile } from 'freedom-syncable-store-types';
import type { TypeOrPromisedType } from 'yaschema';

import type { MailThread } from '../../../modules/mail-types/MailThread.ts';
import type { MailThreadId } from '../../../modules/mail-types/MailThreadId.ts';
import { mailThreadIdInfo } from '../../../modules/mail-types/MailThreadId.ts';
import type { SelectableMailCollectionId } from '../../../modules/mail-types/SelectableMailCollectionId.ts';
import { useActiveUserId } from '../../contexts/active-user-id.ts';
import { getOrCreateEmailAccessForUser } from '../internal/user/getOrCreateEmailAccessForUser.ts';

export interface GetMailThreadsForCollection_MailAddedPacket {
  readonly type: 'mail-added';
  readonly threads: MailThread[];
}

export interface GetMailThreadsForCollection_MailRemovedPacket {
  readonly type: 'mail-removed';
  readonly ids: MailThreadId[];
}

export type GetMailThreadsForCollectionPacket = GetMailThreadsForCollection_MailAddedPacket | GetMailThreadsForCollection_MailRemovedPacket;

// const globalCache: Record<MailCollectionId, MailThread[]> = {};

export const getMailThreadsForCollection = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    // TODO: TEMP
    _collectionId: SelectableMailCollectionId,
    isConnected: () => TypeOrPromisedType<boolean>,
    onData: (value: Result<GetMailThreadsForCollectionPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailThreadsForCollection_MailAddedPacket> => {
    const activeUserId = useActiveUserId(trace);

    if (activeUserId.userId === undefined) {
      return makeSuccess({ type: 'mail-added' as const, threads: [] });
    }

    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, { userId: activeUserId.userId }));

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    const nowDate = new Date();
    // TODO: temp this should load progressively backwards
    const mailStorageBundlePath = paths.storage.year(nowDate).month.date.hour;
    const mailStorageBundle = await getBundleAtPath(trace, userFs, mailStorageBundlePath.value);
    if (!mailStorageBundle.ok) {
      return generalizeFailureResult(trace, mailStorageBundle, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const mailStorageBundlePathString = mailStorageBundle.value.path.toString();
    const removeItemAddedListener = userFs.addListener('itemAdded', async ({ path }) => {
      // TODO: TEMP
      if (path.toString().startsWith(mailStorageBundlePathString)) {
        const mailId = mailIdInfo.checked(path.ids.map(extractUnmarkedSyncableId).find((id) => mailIdInfo.is(id)) ?? '');
        if (mailId === undefined) {
          return;
        }

        const mailPath = (await mailStorageBundlePath.mailId(mailId)).detailed;
        const storedMail = await getJsonFromFile(trace, userFs, mailPath, storedMailSchema);
        if (!storedMail.ok) {
          return;
        }

        await onData(
          makeSuccess({
            type: 'mail-added' as const,
            threads: [
              {
                id: mailThreadIdInfo.make(mailIdInfo.removePrefix(mailId)),
                from: storedMail.value.from,
                to: storedMail.value.to,
                subject: storedMail.value.subject,
                body: storedMail.value.body,
                timeMSec: storedMail.value.timeMSec,
                numMessages: 1,
                numUnread: 1
              }
            ]
          })
        );
      }
    });

    // Periodically checking if the connection is still active
    const checkConnectionInterval = setInterval(async () => {
      if (!(await isConnected())) {
        clearInterval(checkConnectionInterval);
        removeItemAddedListener();
      }
    }, ONE_SEC_MSEC);

    const mailIds = await mailStorageBundle.value.getIds(trace, { type: 'bundle' });
    if (!mailIds.ok) {
      return mailIds;
    }

    const storedMailById: Partial<Record<MailId, StoredMail>> = {};
    const storedMails = await allResultsMapped(trace, mailIds.value, {}, async (trace, id): PR<undefined> => {
      const mailId = extractUnmarkedSyncableId(id);
      if (!mailIdInfo.is(mailId)) {
        return makeSuccess(undefined);
      }

      const storedMail = await getJsonFromFile(trace, userFs, (await mailStorageBundlePath.mailId(mailId)).detailed, storedMailSchema);
      if (!storedMail.ok) {
        return generalizeFailureResult(trace, storedMail, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
      }

      storedMailById[mailId] = storedMail.value;

      return makeSuccess(undefined);
    });
    if (!storedMails.ok) {
      return storedMails;
    }

    const threads: MailThread[] = [];

    for (const [mailId, storedMail] of objectEntries(storedMailById)) {
      if (storedMail === undefined) {
        continue;
      }

      threads.push({
        id: mailThreadIdInfo.make(mailIdInfo.removePrefix(mailId)),
        from: storedMail.from,
        to: storedMail.to,
        subject: storedMail.subject,
        body: storedMail.body,
        timeMSec: storedMail.timeMSec,
        numMessages: 1,
        numUnread: 1
      });
    }

    return makeSuccess({ type: 'mail-added' as const, threads });
  }
);
