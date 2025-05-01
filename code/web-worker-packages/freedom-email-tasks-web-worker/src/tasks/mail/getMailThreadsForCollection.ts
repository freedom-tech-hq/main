import type { PR, Result } from 'freedom-async';
import { allResultsMapped, bestEffort, flushMetrics, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { autoGeneralizeFailureResults } from 'freedom-common-errors';
import { devSetEnv } from 'freedom-contexts';
import { listTimeOrganizedMailIds, type MailId, mailIdInfo } from 'freedom-email-sync';
import type { CollectionLikeId, ThreadLikeId } from 'freedom-email-user';
import { getUserMailPaths, mailCollectionTypes } from 'freedom-email-user';
import { InMemoryLockStore, withAcquiredLock } from 'freedom-locking-types';
import type { PageToken } from 'freedom-paginated-data';
import { extractUnmarkedSyncableId } from 'freedom-sync-types';
import type { TypeOrPromisedType } from 'yaschema';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getOrCreateEmailAccessForUser } from '../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';
import type { GetMailThreadsForCollection_MailAddedPacket } from '../../types/mail/getMailThreadsForCollection/GetMailThreadsForCollection_MailAddedPacket.ts';
import type { GetMailThreadsForCollectionPacket } from '../../types/mail/getMailThreadsForCollection/GetMailThreadsForCollectionPacket.ts';
import { getMailThread } from './getMailThread.ts';

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

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    const collectionType = mailCollectionTypes.checked(collectionId);
    if (collectionType === undefined || collectionType === 'custom') {
      // TODO: TEMP
      return makeSuccess({ type: 'mail-added' as const, threadIds: [] });
    }

    const collectionPaths = paths.collections[collectionType];

    const pagedMailIds = await listTimeOrganizedMailIds(trace, access, { timeOrganizedPaths: collectionPaths });
    if (!pagedMailIds.ok) {
      return pagedMailIds;
    }
    let nextPageToken = pagedMailIds.value.nextPageToken;

    const initiallyLoadedMailIds: ThreadLikeId[] = pagedMailIds.value.items;

    const pendingMailIds: MailId[] = [];
    const removeCollectionChangeListener = userFs.addListener('itemAdded', ({ type, path }) => {
      if (type !== 'file') {
        return;
      } else if (!path.startsWith(collectionPaths.value)) {
        return;
      }

      const lastId = extractUnmarkedSyncableId(path.lastId!);
      if (!mailIdInfo.is(lastId)) {
        return;
      }

      pendingMailIds.push(lastId);

      return withAcquiredLock(trace, lockStore.lock('process'), {}, async (): PR<undefined> => {
        if (pendingMailIds.length === 0) {
          return makeSuccess(undefined);
        }

        const addedMailIds = [...pendingMailIds];
        pendingMailIds.length = 0;

        await onData({ ok: true, value: { type: 'mail-added' as const, threadIds: addedMailIds } });

        return makeSuccess(undefined);
      });
    });

    // Periodically checking if the connection is still active
    let wasDisconnected = false;
    const checkConnectionInterval = setInterval(async () => {
      if (!(await isConnected())) {
        wasDisconnected = true;
        clearInterval(checkConnectionInterval);
        removeCollectionChangeListener();
      }
    }, ONE_SEC_MSEC);

    // TODO: should load lazily based on whats visible instead
    const loadMorePages = makeAsyncResultFunc(
      [import.meta.filename, 'loadMorePages'],
      async (trace, pageToken: PageToken | undefined): PR<undefined> => {
        if (pageToken === undefined || wasDisconnected) {
          return makeSuccess(undefined); // No more pages / disconnected
        }

        const pagedMailIds = await listTimeOrganizedMailIds(trace, access, { timeOrganizedPaths: collectionPaths, pageToken });
        if (!pagedMailIds.ok) {
          return pagedMailIds;
        }
        nextPageToken = pagedMailIds.value.nextPageToken;

        await withAcquiredLock(trace, lockStore.lock('process'), {}, async (): PR<GetMailThreadsForCollection_MailAddedPacket> => {
          flushMetrics()?.();

          return makeSuccess({ type: 'mail-added' as const, threadIds: pagedMailIds.value.items });
        });

        setTimeout(() => loadMorePages(trace, nextPageToken), ONE_SEC_MSEC);

        return makeSuccess(undefined);
      }
    );
    setTimeout(() => loadMorePages(trace, nextPageToken), ONE_SEC_MSEC);

    // Before returning the first page, loading the first 20 items
    await bestEffort(
      trace,
      allResultsMapped(trace, initiallyLoadedMailIds.slice(0, 20), {}, async (trace, mailId) => await getMailThread(trace, mailId))
    );

    return await autoGeneralizeFailureResults(
      trace,
      'lock-timeout',
      withAcquiredLock(trace, lockStore.lock('process'), {}, async (): PR<GetMailThreadsForCollection_MailAddedPacket> => {
        flushMetrics()?.();

        return makeSuccess({ type: 'mail-added' as const, threadIds: initiallyLoadedMailIds });
      })
    );
  }
);
