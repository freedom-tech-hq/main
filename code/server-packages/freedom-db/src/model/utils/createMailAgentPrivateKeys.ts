import { makeSuccess, type PR, uncheckedResult } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { type PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';

import { getPrivateKeyStore } from '../internal/utils/getPrivateKeyStore.ts';

export const createMailAgentPrivateKeys = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, keys: PrivateCombinationCryptoKeySet): PR<undefined> => {
    const privateKeyStore = await uncheckedResult(getPrivateKeyStore(trace));

    await privateKeyStore.mutableObject('server-keys').create(trace, keys);

    return makeSuccess(undefined);
  }
);
