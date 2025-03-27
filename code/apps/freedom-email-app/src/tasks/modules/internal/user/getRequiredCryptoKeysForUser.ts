import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';

import type { EmailUserId } from '../../../../types/EmailUserId.ts';
import { getCryptoKeysDb } from '../storage/getCryptoKeysDb.ts';

export const getRequiredCryptoKeysForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<PrivateCombinationCryptoKeySet> => {
    const cryptoKeysDb = await uncheckedResult(getCryptoKeysDb(trace));

    const userCryptoKeysDb = cryptoKeysDb({ userId });
    const mostRecentKeyId = await userCryptoKeysDb.keys.desc({ limit: 1 }).keys(trace);
    if (!mostRecentKeyId.ok) {
      return mostRecentKeyId;
    } else if (mostRecentKeyId.value.length === 0) {
      return makeFailure(
        new InternalStateError(trace, {
          message: `Crypto keys not found for user: ${userId}`
        })
      );
    }

    const secretAccessor = userCryptoKeysDb.object(mostRecentKeyId.value[0]);
    const cryptoKeys = await secretAccessor.get(trace);
    if (!cryptoKeys.ok) {
      if (cryptoKeys.value.errorCode === 'not-found') {
        return makeFailure(
          new InternalStateError(trace, {
            message: `Crypto keys not found for user: ${userId}`,
            cause: cryptoKeys.value
          })
        );
      }
      return excludeFailureResult(cryptoKeys, 'not-found');
    }

    return makeSuccess(cryptoKeys.value);
  }
);
