import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { EmailUserId } from 'freedom-email-sync';

import { getOrCreateKeyStoreForUser } from '../storage/getOrCreateKeyStoreForUser.ts';
import { generateSignedUserId } from './generateSignedUserId.ts';

export const createUserIdAndCryptoKeys = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<{ userId: EmailUserId; privateKeys: PrivateCombinationCryptoKeySet }> => {
    const privateKeys = await generateCryptoCombinationKeySet(trace);
    if (!privateKeys.ok) {
      return privateKeys;
    }

    const generatedUserId = await generateSignedUserId(trace, { signingKeys: privateKeys.value });
    if (!generatedUserId.ok) {
      return generatedUserId;
    }

    const userId = generatedUserId.value;

    const keyStore = await getOrCreateKeyStoreForUser(trace, { userId });
    if (!keyStore.ok) {
      return keyStore;
    }

    const secretAccessor = keyStore.value.mutableObject(privateKeys.value.id);

    const storedSecret = await secretAccessor.create(trace, privateKeys.value);
    if (!storedSecret.ok) {
      // Conflicts won't happen here since the IDs are UUID based
      return generalizeFailureResult(trace, storedSecret, 'conflict');
    }

    return makeSuccess({ userId, privateKeys: privateKeys.value });
  }
);
