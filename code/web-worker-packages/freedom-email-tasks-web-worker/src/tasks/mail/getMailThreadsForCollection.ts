import type { PR, Result } from 'freedom-async';
import { excludeFailureResult, flushMetrics, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { autoGeneralizeFailureResults, generalizeFailureResult } from 'freedom-common-errors';
import { devSetEnv } from 'freedom-contexts';
import { type MailId } from 'freedom-email-sync';
import type { CollectionLikeId } from 'freedom-email-user';
import { getCollectionDoc, mailCollectionTypes } from 'freedom-email-user';
import { InMemoryLockStore, withAcquiredLock } from 'freedom-locking-types';
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
    devSetEnv('FREEDOM_PROFILE', 'freedom-email-user/utils/getCollectionDoc>**');

    const credential = useActiveCredential(trace).credential;
    const lockStore = new InMemoryLockStore();

    if (credential === undefined) {
      return makeSuccess({ type: 'mail-added' as const, threadIds: [] });
    }

    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    const collectionType = mailCollectionTypes.checked(collectionId);
    if (collectionType === undefined || collectionType === 'custom') {
      // TODO: TEMP
      return makeSuccess({ type: 'mail-added' as const, threadIds: [] });
    }

    // TODO: traverse backwards also
    const collectionDoc = await getCollectionDoc(trace, access, { collectionType, date: new Date(), watch: true });
    if (!collectionDoc.ok) {
      if (collectionDoc.value.errorCode === 'deleted' || collectionDoc.value.errorCode === 'not-found') {
        // TODO: TEMP
        return makeSuccess({ type: 'mail-added' as const, threadIds: [] });
      }

      return generalizeFailureResult(trace, excludeFailureResult(collectionDoc, 'deleted', 'not-found'), [
        'format-error',
        'untrusted',
        'wrong-type'
      ]);
    }

    // TODO: also need to monitor the storage system in case new collection docs are created

    const removeDidApplyDeltasListener = collectionDoc.value.addListener('didApplyDeltas', () =>
      withAcquiredLock(trace, lockStore.lock('process'), {}, async (): PR<undefined> => {
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
          await onData({ ok: true, value: { type: 'mail-added' as const, threadIds: Array.from(addedMailIds) } });
        }

        mailIds = newMailIds;

        return makeSuccess(undefined);
      })
    );

    // Periodically checking if the connection is still active
    const checkConnectionInterval = setInterval(async () => {
      if (!(await isConnected())) {
        clearInterval(checkConnectionInterval);
        removeDidApplyDeltasListener();
        collectionDoc.value.stopWatching();
      }
    }, ONE_SEC_MSEC);

    let mailIds: MailId[];

    return await autoGeneralizeFailureResults(
      trace,
      'lock-timeout',
      withAcquiredLock(trace, lockStore.lock('process'), {}, async (): PR<GetMailThreadsForCollection_MailAddedPacket> => {
        flushMetrics()?.();

        return makeSuccess({ type: 'mail-added' as const, threadIds: Array.from(collectionDoc.value.document.mailIds.iterator()) });
      })
    );
  }
);
