import type { PR, Result, SuccessResult } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess, sleep } from 'freedom-async';
import { makeIsoDateTime, ONE_DAY_MSEC, ONE_SEC_MSEC } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import type { MailId, MailThreadLikeId } from 'freedom-email-api';
import { mailIdInfo } from 'freedom-email-api';
import type { TypeOrPromisedType } from 'yaschema';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { isDemoMode } from '../config/demo-mode.ts';

export interface MailAddedPacket {
  readonly type: 'mail-added';
  readonly addedMailIds: MailId[];
}

export interface MailRemovedPacket {
  readonly type: 'mail-removed';
  readonly removedMailIds: MailId[];
}

export type GetMailIdsForThreadPacket = MailAddedPacket | MailRemovedPacket;

export const getMailIdsForThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    _threadLikeId: MailThreadLikeId,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailIdsForThreadPacket>) => TypeOrPromisedType<void>
  ): PR<MailAddedPacket> => {
    DEV: if (isDemoMode()) {
      return await makeDemoModeResult();
    }

    const credential = useActiveCredential(trace).credential;

    if (credential === undefined) {
      return makeSuccess({ type: 'mail-added' as const, addedMailIds: [] });
    }

    // TODO: implement this method

    // return makeFailure(new NotFoundError(trace, { message: `No thread-like item found with ID ${threadId}`, errorCode: 'not-found' }));
    return makeFailure(new GeneralError(trace, new Error('not implemented yet')));
  }
);

let makeDemoModeResult: () => Promise<SuccessResult<MailAddedPacket>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async () => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  return makeSuccess({
    type: 'mail-added',
    addedMailIds: Array(Math.floor(Math.random() * 5 + 1))
      .fill(0)
      .map(() => mailIdInfo.make(`${makeIsoDateTime(new Date(Date.now() - Math.random() * 30 * ONE_DAY_MSEC))}-${makeUuid()}`))
  });
};
