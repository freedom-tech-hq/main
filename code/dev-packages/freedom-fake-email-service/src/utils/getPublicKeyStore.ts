import type { PR } from 'freedom-async';
import { computeAsyncOnce, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import { type CombinationCryptoKeySet, combinationCryptoKeySetSchema, type CryptoKeySetId } from 'freedom-crypto-data';
import { InMemoryObjectStore, type MutableObjectStore } from 'freedom-object-store-types';

const secretKey = makeUuid();

export const getPublicKeyStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace) =>
    await computeAsyncOnce(
      [import.meta.filename],
      secretKey,
      async (_trace): PR<MutableObjectStore<CryptoKeySetId, CombinationCryptoKeySet>> =>
        makeSuccess(new InMemoryObjectStore<CryptoKeySetId, CombinationCryptoKeySet>({ schema: combinationCryptoKeySetSchema }))
    )
);
