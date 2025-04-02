import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type {
  CombinationCryptoKeySet,
  CryptoKeySetId,
  DecryptingKeySet,
  EncryptingKeySet,
  PrivateCombinationCryptoKeySet,
  SigningKeySet,
  VerifyingKeySet
} from 'freedom-crypto-data';

import type { CryptoService } from '../types/CryptoService.ts';

export const makeCryptoService = ({
  getPrivateCryptoKeySetIds,
  getPrivateCryptoKeysById,
  getPublicCryptoKeysById,
  getMostRecentPrivateCryptoKeys
}: {
  getPrivateCryptoKeySetIds: PRFunc<CryptoKeySetId[]>;
  getPrivateCryptoKeysById: PRFunc<PrivateCombinationCryptoKeySet, 'not-found', [id: CryptoKeySetId]>;
  getPublicCryptoKeysById: PRFunc<CombinationCryptoKeySet, 'not-found', [id: CryptoKeySetId]>;
  getMostRecentPrivateCryptoKeys: PRFunc<PrivateCombinationCryptoKeySet>;
}): CryptoService => ({
  getPrivateCryptoKeySetIds,

  getEncryptingKeySetForId: makeAsyncResultFunc(
    [import.meta.filename, 'getEncryptingKeySetForId'],
    async (trace, id: CryptoKeySetId): PR<EncryptingKeySet, 'not-found'> => {
      const cryptoKeys = await getPublicCryptoKeysById(trace, id);
      if (!cryptoKeys.ok) {
        return cryptoKeys;
      }

      return makeSuccess(cryptoKeys.value.forEncrypting);
    }
  ),

  getVerifyingKeySetForId: makeAsyncResultFunc(
    [import.meta.filename, 'getVerifyingKeySetForId'],
    async (trace, id: CryptoKeySetId): PR<VerifyingKeySet, 'not-found'> => {
      const cryptoKeys = await getPublicCryptoKeysById(trace, id);
      if (!cryptoKeys.ok) {
        return cryptoKeys;
      }

      return makeSuccess(cryptoKeys.value.forVerifying);
    }
  ),

  getSigningKeySet: makeAsyncResultFunc(
    [import.meta.filename, 'getSigningKeySet'],
    async (trace, id?: CryptoKeySetId): PR<SigningKeySet, 'not-found'> => {
      const cryptoKeys = await (id !== undefined ? getPrivateCryptoKeysById(trace, id) : getMostRecentPrivateCryptoKeys(trace));
      if (!cryptoKeys.ok) {
        return cryptoKeys;
      }

      return makeSuccess(cryptoKeys.value.forSigning);
    }
  ),

  getDecryptingKeySet: makeAsyncResultFunc(
    [import.meta.filename, 'getDecryptingKeySet'],
    async (trace, id?: CryptoKeySetId): PR<DecryptingKeySet, 'not-found'> => {
      const cryptoKeys = await (id !== undefined ? getPrivateCryptoKeysById(trace, id) : getMostRecentPrivateCryptoKeys(trace));
      if (!cryptoKeys.ok) {
        return cryptoKeys;
      }

      return makeSuccess(cryptoKeys.value.forDecrypting);
    }
  )
});
