import type { PR, Result } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { MailId, StoredMail } from 'freedom-email-sync';
import { mailIdInfo, storedMailSchema } from 'freedom-email-sync';
import type { CollectionLikeId, MailThread } from 'freedom-email-user';
import { getUserMailPaths } from 'freedom-email-user';
import { extractUnmarkedSyncableId } from 'freedom-sync-types';
import { getBundleAtPath, getJsonFromFile } from 'freedom-syncable-store';
import type { TypeOrPromisedType } from 'yaschema';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getOrCreateEmailAccessForUser } from '../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';
import type { GetMailThreadsForCollection_MailAddedPacket } from '../../types/mail/getMailThreadsForCollection/GetMailThreadsForCollection_MailAddedPacket.ts';
import type { GetMailThreadsForCollectionPacket } from '../../types/mail/getMailThreadsForCollection/GetMailThreadsForCollectionPacket.ts';

// const globalCache: Record<MailCollectionId, MailThread[]> = {};

export const getMailThreadsForCollection = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    // TODO: TEMP
    _collectionId: CollectionLikeId,
    isConnected: () => TypeOrPromisedType<boolean>,
    onData: (value: Result<GetMailThreadsForCollectionPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailThreadsForCollection_MailAddedPacket> => {
    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'mail-added' as const, threads: [] });
    }

    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    const nowDate = new Date();
    // TODO: temp this should load progressively backwards
    const mailStorageBundlePath = paths.storage.year(nowDate).month.day.hour;
    const mailStorageBundle = await getBundleAtPath(trace, userFs, mailStorageBundlePath.value);
    if (!mailStorageBundle.ok) {
      return generalizeFailureResult(trace, mailStorageBundle, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const removeItemAddedListener = userFs.addListener('itemAdded', async ({ path }) => {
      // TODO: TEMP
      if (path.startsWith(mailStorageBundle.value.path)) {
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
                id: mailId,
                from: storedMail.value.from,
                to: storedMail.value.to,
                subject: storedMail.value.subject,
                body: storedMail.value.body,
                timeMSec: storedMail.value.timeMSec,
                numMessages: 1,
                numUnread: 1
              } satisfies MailThread
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
        id: mailId,
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
