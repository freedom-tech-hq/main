import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { Cast } from 'freedom-cast';
import type { CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import type { EmailUserId } from 'freedom-email-sync';
import { InMemoryObjectStore } from 'freedom-object-store-types';

// TODO: TEMP
const globalCache: Record<EmailUserId, InMemoryObjectStore<CryptoKeySetId, PrivateCombinationCryptoKeySet>> = {};

export const getOrCreateKeyStoreForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace, { userId }: { userId: EmailUserId }) => {
    const cached = globalCache[userId];
    if (cached !== undefined) {
      return makeSuccess(cached);
    }

    const output = new InMemoryObjectStore({
      schema: privateCombinationCryptoKeySetSchema,
      _keyType: Cast<CryptoKeySetId>()
    });
    globalCache[userId] = output;

    return makeSuccess(output);
  }
);
