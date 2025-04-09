import { type PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { type PrivateCombinationCryptoKeySet, privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';

import { kvGetValue } from './mockKvDb.ts';

export const getServerPrivateKeys = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<PrivateCombinationCryptoKeySet, 'not-found'> => {
    return kvGetValue(trace, 'server-keys', privateCombinationCryptoKeySetSchema);
  }
);
