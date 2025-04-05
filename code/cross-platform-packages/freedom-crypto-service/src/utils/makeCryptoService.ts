import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';

import type { CryptoService } from '../types/CryptoService.ts';

export const makeCryptoService = ({
  getPrivateCryptoKeySetIds,
  getPrivateCryptoKeysById,
  getMostRecentPrivateCryptoKeys
}: {
  getPrivateCryptoKeySetIds: PRFunc<CryptoKeySetId[]>;
  getPrivateCryptoKeysById: PRFunc<PrivateCombinationCryptoKeySet, 'not-found', [id: CryptoKeySetId]>;
  getMostRecentPrivateCryptoKeys: PRFunc<PrivateCombinationCryptoKeySet>;
}): CryptoService => ({
  getPrivateCryptoKeySetIds,

  getPrivateCryptoKeySet: makeAsyncResultFunc(
    [import.meta.filename, 'getPrivateKeySet'],
    async (trace, id?: CryptoKeySetId): PR<PrivateCombinationCryptoKeySet, 'not-found'> => {
      const cryptoKeys = await (id !== undefined ? getPrivateCryptoKeysById(trace, id) : getMostRecentPrivateCryptoKeys(trace));
      if (!cryptoKeys.ok) {
        return cryptoKeys;
      }

      return makeSuccess(cryptoKeys.value);
    }
  )
});
