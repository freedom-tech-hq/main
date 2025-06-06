import { proxy } from 'comlink';
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
import type { GetMailIdsForThreadPacket, MailAddedPacket } from '../../types/mail/GetMailIdsForThreadPacket.ts';
import { type MailMessagesDataSetId, mailMessagesDataSetIdInfo } from '../../types/mail/MailMessagesDataSetId.ts';
import { isDemoMode } from '../config/demo-mode.ts';
import { loadMoreMessagesByDataSetId } from './loadMoreMailIds.ts';

const getThreadMessagesFromRemote = makeApiFetchTask([import.meta.filename, 'getThreadMessagesFromRemote'], api.thread.id.GET);

export const getMailIdsForThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    threadLikeId: MailThreadLikeId,
    isConnected: () => TypeOrPromisedType<boolean>,
    onData: (value: GetMailIdsForThreadPacket) => TypeOrPromisedType<void>
  ): PR<MailAddedPacket & { dataSetId: MailMessagesDataSetId }, 'not-found'> => {
    const dataSetId = mailMessagesDataSetIdInfo.make(makeUuid());

    DEV: if (isDemoMode()) {
      return await makeDemoModeResult({ dataSetId });
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'mail-added' as const, addedMailIds: [], dataSetId });
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

    let nextPageToken = messages.value.body.nextPageToken;

    const messageCache = new Map<MailId, CachedMessage>();
    cachedMessagesByDataSetId.set(dataSetId, messageCache);

    for (const message of messages.value.body.items) {
      messageCache.set(message.id, { encrypted: true, value: message });
    }

    const lock = new InMemoryLockStore();
    const loadMore = proxy(async (upToAtLeast: number) => {
      await bestEffort(
        trace,
        withAcquiredLock(trace, lock.lock(dataSetId), {}, async (): PR<undefined, 'not-found'> => {
          if (upToAtLeast <= messageCache.size) {
            return makeSuccess(undefined);
          }

          const messages = await getThreadMessagesFromRemote(trace, {
            headers: { authorization: `Bearer ${credential.userId}` },
            params: { threadLikeId },
            query: { pageToken: nextPageToken },
            context: getDefaultApiRoutingContext()
          });
          if (!messages.ok) {
            return messages;
          }

          nextPageToken = messages.value.body.nextPageToken;

          for (const message of messages.value.body.items) {
            messageCache.set(message.id, { encrypted: true, value: message });
          }

          onData({
            type: 'mail-added' as const,
            addedMailIds: messages.value.body.items.map((item) => item.id)
          });

          return makeSuccess(undefined);
        })
      );
    });

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
      addedMailIds: messages.value.body.items.map((item) => item.id),
      dataSetId
    });
  }
);

let makeDemoModeResult: (args: {
  dataSetId: MailMessagesDataSetId;
}) => Promise<SuccessResult<MailAddedPacket & { dataSetId: MailMessagesDataSetId }>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async ({ dataSetId }) => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  return makeSuccess({
    type: 'mail-added',
    addedMailIds: Array(Math.floor(Math.random() * 5 + 1))
      .fill(0)
      .map(() => mailIdInfo.make(`${makeIsoDateTime(new Date(Date.now() - Math.random() * 30 * ONE_DAY_MSEC))}-${makeUuid()}`)),
    dataSetId
  });
};
