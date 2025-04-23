import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { InMemoryObjectStore, type MutableObjectStore } from 'freedom-object-store-types';
import { once } from 'lodash-es';

export const getPrivateKeyStore = makeAsyncResultFunc(
  [import.meta.filename],
  once(
    async (_trace): PR<MutableObjectStore<string, PrivateCombinationCryptoKeySet>> =>
      makeSuccess(new InMemoryObjectStore<string, PrivateCombinationCryptoKeySet>({ schema: privateCombinationCryptoKeySetSchema }))
  )
);
