import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, uncheckedResult } from 'freedom-async';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';

import { getPrivateKeyStore } from './getPrivateKeyStore.ts';

export const getServerPrivateKeys = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<PrivateCombinationCryptoKeySet, 'not-found'> => {
    const privateKeyStore = await uncheckedResult(getPrivateKeyStore(trace));

    return await privateKeyStore.object('server-keys').get(trace);
  }
);
