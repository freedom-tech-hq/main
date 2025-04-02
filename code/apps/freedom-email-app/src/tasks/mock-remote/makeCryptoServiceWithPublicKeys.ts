import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type {
  CombinationCryptoKeySet,
  CryptoKeySetId,
  DecryptingKeySet,
  EncryptingKeySet,
  SigningKeySet,
  VerifyingKeySet
} from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';

export const makeCryptoServiceWithPublicKeys = ({ publicKeys }: { publicKeys: CombinationCryptoKeySet }): CryptoService => {
  const getCryptoKeysById = makeAsyncResultFunc(
    [import.meta.filename, 'getCryptoKeysById'],
    async (trace, id): PR<CombinationCryptoKeySet, 'not-found'> => {
      if (id === publicKeys.id) {
        return makeSuccess(publicKeys);
      }

      return makeFailure(new InternalStateError(trace, { message: `Key not found with ID: ${id}`, errorCode: 'not-found' }));
    }
  );

  return {
    getPrivateCryptoKeySetIds: makeAsyncResultFunc(
      [import.meta.filename, 'getPrivateCryptoKeySetIds'],
      async (_trace): PR<CryptoKeySetId[]> => makeSuccess([])
    ),

    getEncryptingKeySetForId: makeAsyncResultFunc(
      [import.meta.filename, 'getEncryptingKeySetForId'],
      // TODO: should be able to look up keys for other users
      async (trace, id: CryptoKeySetId): PR<EncryptingKeySet, 'not-found'> => await getCryptoKeysById(trace, id)
    ),

    getVerifyingKeySetForId: makeAsyncResultFunc(
      [import.meta.filename, 'getVerifyingKeySetForId'],
      // TODO: should be able to look up keys for other users
      async (trace, id: CryptoKeySetId): PR<VerifyingKeySet, 'not-found'> => await getCryptoKeysById(trace, id)
    ),

    getSigningKeySet: makeAsyncResultFunc(
      [import.meta.filename, 'getSigningKeySet'],
      async (_trace): PR<SigningKeySet, 'not-found'> =>
        makeFailure(new InternalStateError(_trace, { message: 'No signing key found', errorCode: 'not-found' }))
    ),

    getDecryptingKeySet: makeAsyncResultFunc(
      [import.meta.filename, 'getDecryptingKeySet'],
      async (_trace): PR<DecryptingKeySet, 'not-found'> =>
        makeFailure(new InternalStateError(_trace, { message: 'No decrypting key found', errorCode: 'not-found' }))
    )
  };
};
