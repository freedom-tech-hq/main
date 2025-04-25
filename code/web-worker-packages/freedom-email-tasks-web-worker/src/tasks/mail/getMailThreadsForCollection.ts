import type { PR, Result } from 'freedom-async';
import { allResultsMappedSkipFailures, excludeFailureResult, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { MailId } from 'freedom-email-sync';
import type { CollectionLikeId, EmailCredential, MailThread } from 'freedom-email-user';
import { getCollectionDoc, getMailById, mailCollectionTypes } from 'freedom-email-user';
import type { TypeOrPromisedType } from 'yaschema';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getOrCreateEmailAccessForUser } from '../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';
import type { GetMailThreadsForCollection_MailAddedPacket } from '../../types/mail/getMailThreadsForCollection/GetMailThreadsForCollection_MailAddedPacket.ts';
import type { GetMailThreadsForCollectionPacket } from '../../types/mail/getMailThreadsForCollection/GetMailThreadsForCollectionPacket.ts';

export const getMailThreadsForCollection = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    collectionId: CollectionLikeId,
    isConnected: () => TypeOrPromisedType<boolean>,
    onData: (value: Result<GetMailThreadsForCollectionPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailThreadsForCollection_MailAddedPacket> => {
    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'mail-added' as const, threads: [] });
    }

    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    const collectionType = mailCollectionTypes.checked(collectionId);
    if (collectionType === undefined || collectionType === 'custom') {
      // TODO: TEMP
      return makeSuccess({ type: 'mail-added' as const, threads: [] });
    }

    // TODO: traverse backwards also
    const collectionDoc = await getCollectionDoc(trace, access, { collectionType, date: new Date(), watch: true });
    if (!collectionDoc.ok) {
      if (collectionDoc.value.errorCode === 'deleted' || collectionDoc.value.errorCode === 'not-found') {
        // TODO: TEMP
        return makeSuccess({ type: 'mail-added' as const, threads: [] });
      }

      return generalizeFailureResult(trace, excludeFailureResult(collectionDoc, 'deleted', 'not-found'), [
        'format-error',
        'untrusted',
        'wrong-type'
      ]);
    }

    // TODO: also need to monitor the storage system in case new collection docs are created

    let mailIds = Array.from(collectionDoc.value.document.mailIds.iterator());

    const removeDidApplyDeltasListener = collectionDoc.value.addListener('didApplyDeltas', async () => {
      const unusedOldMailIds = new Set(mailIds);

      const newMailIds = Array.from(collectionDoc.value.document.mailIds.iterator());

      const addedMailIds = new Set<MailId>();
      for (const mailId of newMailIds) {
        if (unusedOldMailIds.has(mailId)) {
          unusedOldMailIds.delete(mailId);
        } else {
          addedMailIds.add(mailId);
        }
      }

      if (unusedOldMailIds.size > 0) {
        await onData({ ok: true, value: { type: 'mail-removed' as const, ids: Array.from(unusedOldMailIds) } });
      }

      if (addedMailIds.size > 0) {
        const threads = await getThreadsForMailIds(trace, credential, Array.from(addedMailIds));
        if (!threads.ok) {
          return;
        }

        await onData({ ok: true, value: { type: 'mail-added' as const, threads: threads.value } });
      }

      mailIds = newMailIds;
    });

    // Periodically checking if the connection is still active
    const checkConnectionInterval = setInterval(async () => {
      if (!(await isConnected())) {
        clearInterval(checkConnectionInterval);
        removeDidApplyDeltasListener();
        collectionDoc.value.stopWatching();
      }
    }, ONE_SEC_MSEC);

    const threads = await getThreadsForMailIds(trace, credential, mailIds);
    if (!threads.ok) {
      return threads;
    }

    return makeSuccess({ type: 'mail-added' as const, threads: threads.value });
  }
);

// Helpers

const getThreadsForMailIds = makeAsyncResultFunc(
  [import.meta.filename, 'getThreadsForMailIds'],
  async (trace, credential: EmailCredential, mailIds: MailId[]): PR<MailThread[]> => {
    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    const threads: MailThread[] = [];
    const storedMails = await allResultsMappedSkipFailures(
      trace,
      mailIds,
      { skipErrorCodes: ['not-found'] },
      async (trace, mailId): PR<undefined, 'not-found'> => {
        const storedMail = await getMailById(trace, access, mailId);
        if (!storedMail.ok) {
          return generalizeFailureResult(trace, storedMail, 'not-found');
        }

        threads.push({
          id: mailId,
          from: storedMail.value.from,
          to: storedMail.value.to,
          subject: storedMail.value.subject,
          body: storedMail.value.body,
          timeMSec: storedMail.value.timeMSec,
          numMessages: 1,
          numUnread: 1
        });

        return makeSuccess(undefined);
      }
    );
    if (!storedMails.ok) {
      return storedMails;
    }

    return makeSuccess(threads);
  }
);
