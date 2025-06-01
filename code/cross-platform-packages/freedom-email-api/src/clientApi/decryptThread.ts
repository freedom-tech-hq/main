import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { UserKeys } from 'freedom-crypto-service';

import type { ApiThread } from '../types/ApiThread.ts';
import type { DecryptedThread } from '../types/DecryptedThread.ts';
import { decryptListMessage } from './decryptListMessage.ts';

export const decryptThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, userKeys: UserKeys, thread: ApiThread): PR<DecryptedThread> => {
    // Split
    const { lastUnreadMessage, ...openFields } = thread;

    const messageResult = await decryptListMessage(trace, userKeys, lastUnreadMessage);
    if (!messageResult.ok) {
      return messageResult;
    }

    // Reconstruct
    return makeSuccess<DecryptedThread>({
      ...openFields,
      lastUnreadMessage: messageResult.value
    });
  }
);
