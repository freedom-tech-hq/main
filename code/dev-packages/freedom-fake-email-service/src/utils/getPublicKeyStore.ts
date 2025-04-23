import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type CombinationCryptoKeySet, combinationCryptoKeySetSchema, type CryptoKeySetId } from 'freedom-crypto-data';
import { InMemoryObjectStore, type MutableObjectStore } from 'freedom-object-store-types';
import { once } from 'lodash-es';

export const getPublicKeyStore = makeAsyncResultFunc(
  [import.meta.filename],
  once(
    async (_trace): PR<MutableObjectStore<CryptoKeySetId, CombinationCryptoKeySet>> =>
      makeSuccess(new InMemoryObjectStore<CryptoKeySetId, CombinationCryptoKeySet>({ schema: combinationCryptoKeySetSchema }))
  )
);
