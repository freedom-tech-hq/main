import type { PR } from 'freedom-async';
import { computeAsyncOnce, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { InMemoryObjectStore, type MutableObjectStore } from 'freedom-object-store-types';

const secretKey = makeUuid();

export const getPrivateKeyStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace) =>
    await computeAsyncOnce(
      [import.meta.filename],
      secretKey,
      async (_trace): PR<MutableObjectStore<string, PrivateCombinationCryptoKeySet>> =>
        makeSuccess(new InMemoryObjectStore<string, PrivateCombinationCryptoKeySet>({ schema: privateCombinationCryptoKeySetSchema }))
    )
);
