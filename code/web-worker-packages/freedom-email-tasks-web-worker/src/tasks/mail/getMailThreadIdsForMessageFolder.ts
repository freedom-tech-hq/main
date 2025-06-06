import type { PR, SuccessResult } from 'freedom-async';
import { bestEffort, inline, makeAsyncResultFunc, makeSuccess, sleep } from 'freedom-async';
import { makeIsoDateTime, ONE_DAY_MSEC, ONE_MIN_MSEC, ONE_SEC_MSEC } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import type { MailThreadLikeId, MessageFolder } from 'freedom-email-api';
import { api, mailIdInfo } from 'freedom-email-api';
import { makeApiFetchTask } from 'freedom-fetching';
import { InMemoryLockStore, withAcquiredLock } from 'freedom-locking-types';
import type { TypeOrPromisedType } from 'yaschema';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import type { CachedThread } from '../../caches/cachedThreadsByDataSetId.ts';
import { cachedThreadsByDataSetId } from '../../caches/cachedThreadsByDataSetId.ts';
import { useActiveCredential } from '../../contexts/active-credential.ts';
import type {
  GetMailThreadIdsForMessageFolderPacket,
  MailThreadsAddedPacket
} from '../../types/mail/GetMailThreadIdsForMessageFolderPacket.ts';
import { type MailThreadsDataSetId, mailThreadsDataSetIdInfo } from '../../types/mail/MailThreadsDataSetId.ts';
import { isDemoMode } from '../config/demo-mode.ts';
import { loadMoreThreadsByDataSetId } from './loadMoreMailThreadIds.ts';

const getThreadsFromRemote = makeApiFetchTask([import.meta.filename, 'getThreadsFromRemote'], api.threads.GET);

export const getMailThreadIdsForMessageFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    folder: MessageFolder,
    isConnected: () => TypeOrPromisedType<boolean>,
    onData: (value: GetMailThreadIdsForMessageFolderPacket) => TypeOrPromisedType<void>
  ): PR<MailThreadsAddedPacket & { dataSetId: MailThreadsDataSetId }> => {
    const dataSetId = mailThreadsDataSetIdInfo.make(makeUuid());

    DEV: if (isDemoMode()) {
      return await makeDemoModeResult({ dataSetId });
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'threads-added' as const, addedThreadIds: [], estCount: 0, dataSetId });
    }

    const threads = await getThreadsFromRemote(trace, {
      headers: { authorization: `Bearer ${credential.userId}` },
      query: { folder },
      context: getDefaultApiRoutingContext()
    });
    if (!threads.ok) {
      return threads;
    }

    let lastEstCount = threads.value.body.estCount ?? threads.value.body.items.length;
    let nextPageToken = threads.value.body.nextPageToken;

    const threadCache = new Map<MailThreadLikeId, CachedThread>();
    cachedThreadsByDataSetId.set(dataSetId, threadCache);

    for (const thread of threads.value.body.items) {
      threadCache.set(thread.id, { encrypted: true, value: thread });
    }

    const lock = new InMemoryLockStore();
    const loadMore = async (upToAtLeast: number) => {
      await bestEffort(
        trace,
        withAcquiredLock(trace, lock.lock(dataSetId), {}, async (): PR<undefined> => {
          if (upToAtLeast <= threadCache.size) {
            return makeSuccess(undefined);
          }

          const threads = await getThreadsFromRemote(trace, {
            headers: { authorization: `Bearer ${credential.userId}` },
            query: { folder, pageToken: nextPageToken },
            context: getDefaultApiRoutingContext()
          });
          if (!threads.ok) {
            return threads;
          }

          lastEstCount = threads.value.body.estCount ?? threadCache.size + threads.value.body.items.length;
          nextPageToken = threads.value.body.nextPageToken;

          for (const thread of threads.value.body.items) {
            threadCache.set(thread.id, { encrypted: true, value: thread });
          }

          onData({
            type: 'threads-added' as const,
            addedThreadIds: threads.value.body.items.map((item) => item.id),
            estCount: lastEstCount
          });

          return makeSuccess(undefined);
        })
      );
    };

    loadMoreThreadsByDataSetId.set(dataSetId, loadMore);

    // Not waiting
    inline(async () => {
      while (await isConnected()) {
        await sleep(ONE_MIN_MSEC);
      }

      cachedThreadsByDataSetId.delete(dataSetId);
      loadMoreThreadsByDataSetId.delete(dataSetId);
    });

    return makeSuccess({
      type: 'threads-added' as const,
      addedThreadIds: threads.value.body.items.map((item) => item.id),
      estCount: lastEstCount,
      dataSetId
    });
  }
);

// Helpers

let makeDemoModeResult: (args: {
  dataSetId: MailThreadsDataSetId;
}) => Promise<SuccessResult<MailThreadsAddedPacket & { dataSetId: MailThreadsDataSetId }>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async ({ dataSetId }) => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  return makeSuccess({
    type: 'threads-added',
    addedThreadIds: Array(1000)
      .fill(0)
      .map(() => mailIdInfo.make(`${makeIsoDateTime(new Date(Date.now() - Math.random() * 30 * ONE_DAY_MSEC))}-${makeUuid()}`)),
    estCount: 1000,
    dataSetId
  });
};
