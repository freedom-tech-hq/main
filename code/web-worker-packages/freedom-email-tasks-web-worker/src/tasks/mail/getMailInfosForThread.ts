import type { PR, SuccessResult } from 'freedom-async';
import { bestEffort, inline, makeAsyncResultFunc, makeSuccess, sleep } from 'freedom-async';
import { makeIsoDateTime, ONE_DAY_MSEC, ONE_MIN_MSEC, ONE_SEC_MSEC } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import type { MailId, MailThreadLikeId } from 'freedom-email-api';
import { api, mailIdInfo } from 'freedom-email-api';
import { makeApiFetchTask } from 'freedom-fetching';
import { InMemoryLockStore, withAcquiredLock } from 'freedom-locking-types';
import type { TypeOrPromisedType } from 'yaschema';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import type { CachedMessage } from '../../caches/cachedMessagesByDataSetId.ts';
import { cachedMessagesByDataSetId } from '../../caches/cachedMessagesByDataSetId.ts';
import { useActiveCredential } from '../../contexts/active-credential.ts';
import type { GetMailInfosForThreadPacket, MailAddedPacket } from '../../types/mail/GetMailInfosForThreadPacket.ts';
import { type MailMessagesDataSetId, mailMessagesDataSetIdInfo } from '../../types/mail/MailMessagesDataSetId.ts';
import { isDemoMode } from '../config/demo-mode.ts';
import { loadMoreMessagesByDataSetId } from './loadMoreMailIds.ts';

const getThreadMessagesFromRemote = makeApiFetchTask([import.meta.filename, 'getThreadMessagesFromRemote'], api.thread.id.GET);

export const getMailInfosForThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    threadLikeId: MailThreadLikeId,
    isConnected: () => TypeOrPromisedType<boolean>,
    onData: (value: GetMailInfosForThreadPacket) => TypeOrPromisedType<void>
  ): PR<MailAddedPacket & { dataSetId: MailMessagesDataSetId }, 'not-found'> => {
    const dataSetId = mailMessagesDataSetIdInfo.make(makeUuid());

    DEV: if (isDemoMode()) {
      return await makeDemoModeResult({ dataSetId, isConnected, onData });
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'mail-added' as const, addedMailInfos: [], estCount: 0, estRemainingCount: 0, dataSetId });
    }

    const messages = await getThreadMessagesFromRemote(trace, {
      headers: { authorization: `Bearer ${credential.userId}` },
      params: { threadLikeId },
      query: {},
      context: getDefaultApiRoutingContext()
    });
    if (!messages.ok) {
      return messages;
    }

    let lastEstCount = messages.value.body.estCount ?? messages.value.body.items.length;
    let numLoaded = messages.value.body.items.length;
    let nextPageToken = messages.value.body.nextPageToken;

    const messageCache = new Map<MailId, CachedMessage>();
    cachedMessagesByDataSetId.set(dataSetId, messageCache);

    for (const message of messages.value.body.items) {
      messageCache.set(message.id, { encrypted: true, value: message });
    }

    const lock = new InMemoryLockStore();
    const loadMore = async (upToAtLeast: number) => {
      await bestEffort(
        trace,
        withAcquiredLock(trace, lock.lock(dataSetId), {}, async (): PR<undefined, 'not-found'> => {
          while (nextPageToken !== undefined && upToAtLeast > messageCache.size) {
            const messages = await getThreadMessagesFromRemote(trace, {
              headers: { authorization: `Bearer ${credential.userId}` },
              params: { threadLikeId },
              query: { pageToken: nextPageToken },
              context: getDefaultApiRoutingContext()
            });
            if (!messages.ok) {
              return messages;
            }

            lastEstCount = messages.value.body.estCount ?? messageCache.size + messages.value.body.items.length;
            numLoaded += messages.value.body.items.length;
            nextPageToken = messages.value.body.nextPageToken;

            for (const message of messages.value.body.items) {
              messageCache.set(message.id, { encrypted: true, value: message });
            }

            onData({
              type: 'mail-added' as const,
              addedMailInfos: messages.value.body.items.map((item) => ({
                id: item.id,
                timeMSec: new Date(item.updatedAt).getTime()
              })),
              estCount: lastEstCount,
              estRemainingCount: nextPageToken === undefined ? 0 : Math.max(0, lastEstCount - numLoaded)
            });

            if (nextPageToken === undefined || messages.value.body.items.length === 0) {
              break; // No more messages
            }
          }

          return makeSuccess(undefined);
        })
      );
    };

    loadMoreMessagesByDataSetId.set(dataSetId, loadMore);

    // Not waiting
    inline(async () => {
      while (await isConnected()) {
        await sleep(ONE_MIN_MSEC);
      }

      cachedMessagesByDataSetId.delete(dataSetId);
      loadMoreMessagesByDataSetId.delete(dataSetId);
    });

    return makeSuccess({
      type: 'mail-added' as const,
      addedMailInfos: messages.value.body.items.map((item) => ({
        id: item.id,
        timeMSec: new Date(item.updatedAt).getTime()
      })),
      estCount: lastEstCount,
      estRemainingCount: Math.max(0, lastEstCount - numLoaded),
      dataSetId
    });
  }
);

let makeDemoModeResult: (args: {
  dataSetId: MailMessagesDataSetId;
  isConnected: () => TypeOrPromisedType<boolean>;
  onData: (value: GetMailInfosForThreadPacket) => TypeOrPromisedType<void>;
}) => Promise<SuccessResult<MailAddedPacket & { dataSetId: MailMessagesDataSetId }>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async ({ dataSetId, isConnected, onData }) => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  const initialCount = Math.floor(Math.random() * 5 + 1);
  const estCount = initialCount + (Math.random() > 0.5 ? Math.floor(Math.random() * 5 + 1) : 0);
  let numLoaded = initialCount;

  const loadMore = async (upToAtLeast: number) => {
    if (upToAtLeast <= numLoaded) {
      return; // Nothing to do
    }

    const addCount = Math.max(0, estCount - numLoaded);
    numLoaded += addCount;

    onData({
      type: 'mail-added',
      addedMailInfos: Array(addCount)
        .fill(0)
        .map(() => {
          // We want these to be older than the initial mails
          const timeMSec = Date.now() - (Math.random() + 1) * 30 * ONE_DAY_MSEC;

          return {
            id: mailIdInfo.make(`${makeIsoDateTime(new Date(timeMSec))}-${makeUuid()}`),
            timeMSec
          };
        }),
      estCount,
      estRemainingCount: Math.max(0, estCount - numLoaded)
    });
  };

  loadMoreMessagesByDataSetId.set(dataSetId, loadMore);

  // Not waiting
  inline(async () => {
    while (await isConnected()) {
      await sleep(ONE_MIN_MSEC);
    }

    loadMoreMessagesByDataSetId.delete(dataSetId);
  });

  return makeSuccess({
    type: 'mail-added',
    addedMailInfos: Array(initialCount)
      .fill(0)
      .map(() => {
        const timeMSec = Date.now() - Math.random() * 30 * ONE_DAY_MSEC;

        return {
          id: mailIdInfo.make(`${makeIsoDateTime(new Date(timeMSec))}-${makeUuid()}`),
          timeMSec
        };
      }),
    estCount,
    estRemainingCount: Math.max(0, estCount - numLoaded),
    dataSetId
  });
};
