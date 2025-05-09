import { type PR, uncheckedResult } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { type PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';

import { getPrivateKeyStore } from '../internal/utils/getPrivateKeyStore.ts';

export const getMailAgentPrivateKeys = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<PrivateCombinationCryptoKeySet, 'not-found'> => {
    const privateKeyStore = await uncheckedResult(getPrivateKeyStore(trace));

    return await privateKeyStore.object('server-keys').get(trace);
  }
);
