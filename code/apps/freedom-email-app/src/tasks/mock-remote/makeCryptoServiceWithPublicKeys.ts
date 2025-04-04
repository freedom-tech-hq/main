import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError, NotFoundError } from 'freedom-common-errors';
import type { CombinationCryptoKeySet, CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { type CryptoService, makeCryptoService } from 'freedom-crypto-service';

export interface MockRemoteCryptoService extends CryptoService {
  addPublicKeys: (args: { publicKeys: CombinationCryptoKeySet }) => void;
}

export const makeCryptoServiceForMockRemote = (): MockRemoteCryptoService => {
  const allPublicKeys: Partial<Record<CryptoKeySetId, CombinationCryptoKeySet>> = {};

  const cryptoService = makeCryptoService({
    getPrivateCryptoKeySetIds: makeAsyncResultFunc(
      [import.meta.filename, 'getPrivateCryptoKeySetIds'],
      async (_trace): PR<CryptoKeySetId[]> => makeSuccess([])
    ),

    getPrivateCryptoKeysById: makeAsyncResultFunc(
      [import.meta.filename, 'getPrivateCryptoKeysById'],
      async (trace, id): PR<PrivateCombinationCryptoKeySet, 'not-found'> =>
        makeFailure(new InternalStateError(trace, { message: `Key not found with ID: ${id}`, errorCode: 'not-found' }))
    ),

    getPublicCryptoKeysById: makeAsyncResultFunc(
      [import.meta.filename, 'getPublicCryptoKeysById'],
      async (trace, id): PR<CombinationCryptoKeySet, 'not-found'> => {
        const found = allPublicKeys[id];
        if (found !== undefined) {
          return makeSuccess(found);
        }

        return makeFailure(new InternalStateError(trace, { message: `Key not found with ID: ${id}`, errorCode: 'not-found' }));
      }
    ),

    getMostRecentPrivateCryptoKeys: makeAsyncResultFunc(
      [import.meta.filename, 'getMostRecentPrivateCryptoKeys'],
      async (trace): PR<PrivateCombinationCryptoKeySet> =>
        makeFailure(new NotFoundError(trace, { message: "Private keys aren't available in the mock remote" }))
    )
  });

  const modifiedCryptoService = cryptoService as Partial<MockRemoteCryptoService>;

  modifiedCryptoService.addPublicKeys = ({ publicKeys }) => {
    allPublicKeys[publicKeys.id] = publicKeys;
  };

  return modifiedCryptoService as MockRemoteCryptoService;
};
