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
  GetMailThreadInfosForMessageFolderPacket,
  MailThreadsAddedPacket
} from '../../types/mail/GetMailThreadInfosForMessageFolderPacket.ts';
import { type MailThreadsDataSetId, mailThreadsDataSetIdInfo } from '../../types/mail/MailThreadsDataSetId.ts';
import { isDemoMode } from '../config/demo-mode.ts';
import { loadMoreThreadsByDataSetId } from './loadMoreMailThreadIds.ts';

const getThreadsFromRemote = makeApiFetchTask([import.meta.filename, 'getThreadsFromRemote'], api.threads.GET);

export const getMailThreadInfosForMessageFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    folder: MessageFolder,
    isConnected: () => TypeOrPromisedType<boolean>,
    onData: (value: GetMailThreadInfosForMessageFolderPacket) => TypeOrPromisedType<void>
  ): PR<MailThreadsAddedPacket & { dataSetId: MailThreadsDataSetId }> => {
    const dataSetId = mailThreadsDataSetIdInfo.make(makeUuid());

    DEV: if (isDemoMode()) {
      return await makeDemoModeResult({ dataSetId });
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'threads-added' as const, addedThreadInfos: [], estCount: 0, estRemainingCount: 0, dataSetId });
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
    let numLoaded = threads.value.body.items.length;
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
          while (nextPageToken !== undefined && upToAtLeast > threadCache.size) {
            const threads = await getThreadsFromRemote(trace, {
              headers: { authorization: `Bearer ${credential.userId}` },
              query: { folder, pageToken: nextPageToken },
              context: getDefaultApiRoutingContext()
            });
            if (!threads.ok) {
              return threads;
            }

            lastEstCount = threads.value.body.estCount ?? threadCache.size + threads.value.body.items.length;
            numLoaded += threads.value.body.items.length;
            nextPageToken = threads.value.body.nextPageToken;

            for (const thread of threads.value.body.items) {
              threadCache.set(thread.id, { encrypted: true, value: thread });
            }

            onData({
              type: 'threads-added' as const,
              addedThreadInfos: threads.value.body.items.map((item) => ({
                id: item.id,
                timeMSec: new Date(item.lastMessage.updatedAt).getTime()
              })),
              estCount: lastEstCount,
              estRemainingCount: nextPageToken === undefined ? 0 : Math.max(0, lastEstCount - numLoaded)
            });

            if (nextPageToken === undefined || threads.value.body.items.length === 0) {
              break; // No more threads
            }
          }

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
      addedThreadInfos: threads.value.body.items.map((item) => ({
        id: item.id,
        timeMSec: new Date(item.lastMessage.updatedAt).getTime()
      })),
      estCount: lastEstCount,
      estRemainingCount: Math.max(0, lastEstCount - numLoaded),
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
    addedThreadInfos: Array(1000)
      .fill(0)
      .map(() => {
        const timeMSec = Date.now() - Math.random() * 30 * ONE_DAY_MSEC;

        return {
          id: mailIdInfo.make(`${makeIsoDateTime(new Date(timeMSec))}-${makeUuid()}`),
          timeMSec
        };
      }),
    estCount: 1000,
    estRemainingCount: 0,
    dataSetId
  });
};
