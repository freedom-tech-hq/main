import type { PR, Result } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableId } from 'freedom-sync-types';
import { getBundleAtPath, getConflictFreeDocumentFromBundleAtPath, getJsonFromFileAtPath } from 'freedom-syncable-store-types';
import type { TypeOrPromisedType } from 'yaschema';

import { type MailCollectionId, mailCollectionIdInfo } from '../../../modules/mail-types/MailCollectionId.js';
import type { MailThread } from '../../../modules/mail-types/MailThread.js';
import { type MailThreadId, mailThreadIdInfo } from '../../../modules/mail-types/MailThreadId.js';
import { MAIL_COLLECTIONS_BUNDLE_ID, MAIL_FOLDER_ID, MAIL_STORAGE_BUNDLE_ID } from '../../consts/user-syncable-paths.js';
import { useActiveUserId } from '../../contexts/active-user-id.js';
import { makeMailCollectionDocumentFromSnapshot } from '../../types/MailCollectionDocument.js';
import { storedMailSchema } from '../../types/StoredMail.js';
import { getUserFs } from '../internal/storage/getUserFs.js';

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
    collectionId: MailCollectionId,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailThreadsForCollectionPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailThreadsForCollection_MailAddedPacket> => {
    const activeUserId = useActiveUserId(trace);

    if (activeUserId.userId === undefined) {
      return makeSuccess({ type: 'mail-added' as const, threads: [] });
    }

    const userFs = await getUserFs(trace, { userId: activeUserId.userId });
    if (!userFs.ok) {
      return userFs;
    }

    const mailStorageBundle = await getBundleAtPath(
      trace,
      userFs.value,
      userFs.value.path.dynamic.append(MAIL_FOLDER_ID, MAIL_STORAGE_BUNDLE_ID)
    );
    if (!mailStorageBundle.ok) {
      return generalizeFailureResult(trace, mailStorageBundle, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const mailCollectionsBundle = await getBundleAtPath(
      trace,
      userFs.value,
      userFs.value.path.dynamic.append(MAIL_FOLDER_ID, MAIL_COLLECTIONS_BUNDLE_ID)
    );
    if (!mailCollectionsBundle.ok) {
      return generalizeFailureResult(trace, mailCollectionsBundle, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const inboxPath = userFs.value.path.dynamic.append(
      MAIL_FOLDER_ID,
      MAIL_COLLECTIONS_BUNDLE_ID,
      mailCollectionIdInfo.removePrefix(collectionId) as SyncableId
    );
    const inboxDoc = await getConflictFreeDocumentFromBundleAtPath(trace, userFs.value, inboxPath, {
      newDocument: makeMailCollectionDocumentFromSnapshot,
      // TODO: TEMP
      isSnapshotValid: async () => makeSuccess(true),
      // TODO: TEMP
      isDeltaValidForDocument: async () => makeSuccess(true)
    });
    if (!inboxDoc.ok) {
      return generalizeFailureResult(trace, inboxDoc, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const syncableMailIds = Array.from(inboxDoc.value.syncableMailIds.values());
    const storedMails = await allResultsMapped(trace, syncableMailIds, {}, async (trace, syncableMailId) =>
      getJsonFromFileAtPath(trace, userFs.value, mailStorageBundle.value.path.dynamic.append(syncableMailId), storedMailSchema)
    );
    if (!storedMails.ok) {
      return generalizeFailureResult(trace, storedMails, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const threads: MailThread[] = [];

    let index = 0;
    for (const storedMail of storedMails.value) {
      threads.push({
        id: mailThreadIdInfo.make(syncableMailIds[index]),
        from: storedMail.from,
        to: storedMail.to,
        subject: storedMail.subject,
        body: storedMail.body,
        timeMSec: storedMail.timeMSec,
        numMessages: 1,
        numUnread: 1
      });

      index += 1;
    }

    return makeSuccess({ type: 'mail-added' as const, threads });

    // const cached = globalCache[collectionId];
    // if (cached === undefined) {
    //   const mail: MailThread[] = [];

    //   const numEmails = [0, 1, 3, 10, 70, 100, 250, 1000, 10000][Math.floor(Math.random() * 9)];
    //   const now = Date.now();
    //   const startTimeMSec = now - Math.random() * ONE_DAY_MSEC - Math.random() * ONE_HOUR_MSEC - Math.random() * ONE_MIN_MSEC;
    //   const intervalPerEmail = (now - startTimeMSec) / numEmails;
    //   for (let i = 0; i < numEmails; i += 1) {
    //     mail.push({
    //       id: mailThreadIdInfo.make(`${collectionId}-${makeUuid()}`),
    //       from: 'brian@linefeedr.com',
    //       to: 'brian@linefeedr.com',
    //       subject: `(${i}) This is a sample subject, which could be a little long`,
    //       body: 'But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?',
    //       timeMSec: startTimeMSec + i * intervalPerEmail,
    //       numMessages: numEmails,
    //       numUnread: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : 0
    //     });
    //   }

    //   globalCache[collectionId] = mail;
    // }

    // return makeSuccess({ type: 'mail-added' as const, threads: globalCache[collectionId] });
  }
);
