import type { PR, Result, SuccessResult } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, sleep } from 'freedom-async';
import { makeIsoDateTime, ONE_DAY_MSEC, ONE_SEC_MSEC } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import type { MailThreadLikeId, MessageFolder } from 'freedom-email-api';
import { api, mailIdInfo } from 'freedom-email-api';
import { makeApiFetchTask } from 'freedom-fetching';
import type { TypeOrPromisedType } from 'yaschema';
import { getDefaultApiRoutingContext } from 'yaschema-api';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { isDemoMode } from '../config/demo-mode.ts';

const getThreadsFromRemote = makeApiFetchTask([import.meta.filename, 'getThreadsFromRemote'], api.threads.GET);

export interface MailThreadsAddedPacket {
  readonly type: 'threads-added';
  readonly addedThreadIds: MailThreadLikeId[];
}

export interface MailThreadsRemovedPacket {
  readonly type: 'threads-removed';
  readonly removedThreadIds: MailThreadLikeId[];
}

export type GetMailThreadIdsForMessageFolderPacket = MailThreadsAddedPacket | MailThreadsRemovedPacket;

export const getMailThreadIdsForMessageFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    _folder: MessageFolder,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailThreadIdsForMessageFolderPacket>) => TypeOrPromisedType<void>
  ): PR<MailThreadsAddedPacket> => {
    DEV: if (isDemoMode()) {
      return await makeDemoModeResult();
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'threads-added' as const, addedThreadIds: [] });
    }

    // TODO: deal with pagination

    const threads = await getThreadsFromRemote(trace, {
      headers: { authorization: `Bearer ${credential.userId}` },
      query: {},
      context: getDefaultApiRoutingContext()
    });
    if (!threads.ok) {
      return threads;
    }

    return makeSuccess({ type: 'threads-added' as const, addedThreadIds: threads.value.body.items.map((item) => item.id) });
  }
);

// Helpers

let makeDemoModeResult: () => Promise<SuccessResult<MailThreadsAddedPacket>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async () => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  return makeSuccess({
    type: 'threads-added',
    addedThreadIds: Array(1000)
      .fill(0)
      .map(() => mailIdInfo.make(`${makeIsoDateTime(new Date(Date.now() - Math.random() * 30 * ONE_DAY_MSEC))}-${makeUuid()}`))
  });
};
