import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { EmailUserId } from 'freedom-email-sync';

import { getOrCreateKeyStoreForUser } from '../storage/getOrCreateKeyStoreForUser.ts';

export const getRequiredPrivateKeysForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<PrivateCombinationCryptoKeySet> => {
    const keyStore = await uncheckedResult(getOrCreateKeyStoreForUser(trace, { userId }));

    const mostRecentKeyId = await keyStore.keys.desc({ limit: 1 }).keys(trace);
    if (!mostRecentKeyId.ok) {
      return mostRecentKeyId;
    } else if (mostRecentKeyId.value.length === 0) {
      return makeFailure(
        new InternalStateError(trace, {
          message: `Crypto keys not found for user: ${userId}`
        })
      );
    }

    const secretAccessor = keyStore.object(mostRecentKeyId.value[0]);
    const privateKeys = await secretAccessor.get(trace);
    if (!privateKeys.ok) {
      if (privateKeys.value.errorCode === 'not-found') {
        return makeFailure(
          new InternalStateError(trace, {
            message: `Crypto keys not found for user: ${userId}`,
            cause: privateKeys.value
          })
        );
      }
      return excludeFailureResult(privateKeys, 'not-found');
    }

    return makeSuccess(privateKeys.value);
  }
);
