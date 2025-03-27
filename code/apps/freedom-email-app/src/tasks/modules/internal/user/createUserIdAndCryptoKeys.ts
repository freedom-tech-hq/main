import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';

import type { EmailUserId } from '../../../../types/EmailUserId.ts';
import { getCryptoKeysDb } from '../storage/getCryptoKeysDb.ts';
import { generateSignedUserId } from './generateSignedUserId.ts';

export const createUserIdAndCryptoKeys = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<{ userId: EmailUserId; cryptoKeys: PrivateCombinationCryptoKeySet }> => {
    const cryptoKeysDb = await uncheckedResult(getCryptoKeysDb(trace));

    const cryptoKeys = await generateCryptoCombinationKeySet(trace);
    if (!cryptoKeys.ok) {
      return cryptoKeys;
    }

    const generatedUserId = await generateSignedUserId(trace, { signingKeys: cryptoKeys.value });
    if (!generatedUserId.ok) {
      return generatedUserId;
    }

    const userId = generatedUserId.value;

    const secretAccessor = cryptoKeysDb({ userId }).mutableObject(cryptoKeys.value.id);

    const storedSecret = await secretAccessor.create(trace, cryptoKeys.value);
    if (!storedSecret.ok) {
      // Conflicts won't happen here since the IDs are UUID based
      return generalizeFailureResult(trace, storedSecret, 'conflict');
    }

    return makeSuccess({ userId, cryptoKeys: cryptoKeys.value });
  }
);
