import type { PR, Result } from 'freedom-async';
import { allResultsMapped, log, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractUnmarkedSyncableId, prefixedUuidId } from 'freedom-sync-types';
import {
  getBundleAtPath,
  getConflictFreeDocumentFromBundleAtPath,
  getJsonFromFileAtPath,
  getMutableConflictFreeDocumentFromBundleAtPath
} from 'freedom-syncable-store-types';
import type { TypeOrPromisedType } from 'yaschema';

import { type MailCollectionId } from '../../../modules/mail-types/MailCollectionId.ts';
import { mailIdInfo } from '../../../modules/mail-types/MailId.ts';
import type { MailThread } from '../../../modules/mail-types/MailThread.ts';
import { type MailThreadId, mailThreadIdInfo } from '../../../modules/mail-types/MailThreadId.ts';
import { MAIL_COLLECTIONS_BUNDLE_ID, MAIL_FOLDER_ID, MAIL_STORAGE_BUNDLE_ID } from '../../consts/user-syncable-paths.ts';
import { useActiveUserId } from '../../contexts/active-user-id.ts';
import { makeMailCollectionDocumentFromSnapshot } from '../../types/MailCollectionDocument.ts';
import { storedMailSchema } from '../../types/StoredMail.ts';
import { getUserFs } from '../internal/storage/getUserFs.ts';

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
    isConnected: () => TypeOrPromisedType<boolean>,
    onData: (value: Result<GetMailThreadsForCollectionPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailThreadsForCollection_MailAddedPacket> => {
    const activeUserId = useActiveUserId(trace);

    if (activeUserId.userId === undefined) {
      return makeSuccess({ type: 'mail-added' as const, threads: [] });
    }

    const userFs = await getUserFs(trace, { userId: activeUserId.userId });
    if (!userFs.ok) {
      return userFs;
    }

    const mailFolderId = await MAIL_FOLDER_ID(userFs.value);
    const mailStorageBundleId = await MAIL_STORAGE_BUNDLE_ID(userFs.value);
    const mailCollectionsBundleId = await MAIL_COLLECTIONS_BUNDLE_ID(userFs.value);

    const mailStorageBundle = await getBundleAtPath(trace, userFs.value, userFs.value.path.append(mailFolderId, mailStorageBundleId));
    if (!mailStorageBundle.ok) {
      return generalizeFailureResult(trace, mailStorageBundle, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const mailCollectionsBundle = await getBundleAtPath(
      trace,
      userFs.value,
      userFs.value.path.append(mailFolderId, mailCollectionsBundleId)
    );
    if (!mailCollectionsBundle.ok) {
      return generalizeFailureResult(trace, mailCollectionsBundle, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const mailStorageBundlePathString = mailStorageBundle.value.path.toString();
    const removeItemAddedListener = userFs.value.addListener('itemAdded', async ({ type, path, hash }) => {
      if (path.toString().startsWith(mailStorageBundlePathString)) {
        const mailId = extractUnmarkedSyncableId(path.lastId!);
        if (!mailIdInfo.is(mailId)) {
          return;
        }

        // TODO: This isnt really the right place for adding to collections
        const collectionIds = await mailCollectionsBundle.value.getIds(trace, { type: 'bundle' });
        if (!collectionIds.ok) {
          log().debug?.(trace, 'Failed to get collection IDs:', collectionIds.value);
          return;
        }

        for (const collectionId of collectionIds.value) {
          const collectionPath = mailCollectionsBundle.value.path.append(collectionId);
          const collectionDoc = await getMutableConflictFreeDocumentFromBundleAtPath(trace, userFs.value, collectionPath, {
            newDocument: makeMailCollectionDocumentFromSnapshot,
            //   // TODO: TEMP
            isSnapshotValid: async () => makeSuccess(true),
            //   // TODO: TEMP
            isDeltaValidForDocument: async () => makeSuccess(true)
          });
          if (!collectionDoc.ok) {
            log().debug?.(trace, `Failed to read collection ${collectionId}:`, collectionDoc.value);
            continue;
          }

          if (collectionDoc.value.document.collectionType.get() === 'inbox') {
            collectionDoc.value.document.mailIds.append([mailId]);
            const saved = await collectionDoc.value.save(trace);
            if (!saved.ok) {
              log().debug?.(trace, `Failed to save collection ${collectionId}:`, saved.value);
              continue;
            }

            const mailJson = await getJsonFromFileAtPath(trace, userFs.value, path, storedMailSchema);
            if (!mailJson.ok) {
              log().debug?.(trace, `Failed to read mail ${mailId}:`, mailJson.value);
              continue;
            }

            const storedMail = mailJson.value;

            await onData(
              makeSuccess({
                type: 'mail-added' as const,
                threads: [
                  {
                    id: mailThreadIdInfo.make(mailIdInfo.removePrefix(mailId)),
                    from: storedMail.from,
                    to: storedMail.to,
                    subject: storedMail.subject,
                    body: storedMail.body,
                    timeMSec: storedMail.timeMSec,
                    numMessages: 1,
                    numUnread: 1
                  }
                ]
              })
            );
          }
        }

        // const inboxPath = userFs.value.path.append(mailFolderId, mailCollectionsBundleId, mailCollectionsInboxDocumentId);
        // const inboxDoc = await getMutableConflictFreeDocumentFromBundleAtPath(trace, userFs.value, inboxPath, {
        //   newDocument: makeMailCollectionDocumentFromSnapshot,
        //   // TODO: TEMP
        //   isSnapshotValid: async () => makeSuccess(true),
        //   // TODO: TEMP
        //   isDeltaValidForDocument: async () => makeSuccess(true)
        // });
        // if (!inboxDoc.ok) {
        //   return generalizeFailureResult(trace, inboxDoc, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
        // }

        // inboxDoc.value.document.mailIds.append(mailIds);
        // const savedInboxDoc = await inboxDoc.value.save(trace);
        // if (!savedInboxDoc.ok) {
        //   return generalizeFailureResult(trace, savedInboxDoc, 'conflict');
        // }
      }
    });

    // Periodically checking if the connection is still active
    const checkConnectionInterval = setInterval(async () => {
      if (!(await isConnected())) {
        clearInterval(checkConnectionInterval);
        removeItemAddedListener();
      }
    }, ONE_SEC_MSEC);

    const collectionPath = userFs.value.path.append(mailFolderId, mailCollectionsBundleId, prefixedUuidId('bundle', collectionId));
    const collectionDoc = await getConflictFreeDocumentFromBundleAtPath(trace, userFs.value, collectionPath, {
      newDocument: makeMailCollectionDocumentFromSnapshot,
      // TODO: TEMP
      isSnapshotValid: async () => makeSuccess(true),
      // TODO: TEMP
      isDeltaValidForDocument: async () => makeSuccess(true)
    });
    if (!collectionDoc.ok) {
      return generalizeFailureResult(trace, collectionDoc, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const mailIds = Array.from(collectionDoc.value.mailIds.values());
    const storedMails = await allResultsMapped(
      trace,
      mailIds,
      {},
      async (trace, mailId) =>
        await getJsonFromFileAtPath(
          trace,
          userFs.value,
          mailStorageBundle.value.path.append(prefixedUuidId('file', mailId)),
          storedMailSchema
        )
    );
    if (!storedMails.ok) {
      return generalizeFailureResult(trace, storedMails, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const threads: MailThread[] = [];

    let index = 0;
    for (const storedMail of storedMails.value) {
      const mailId = mailIds[index];
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
