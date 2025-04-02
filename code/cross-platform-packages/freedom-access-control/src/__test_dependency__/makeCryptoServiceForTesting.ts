/* node:coverage disable */

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { CombinationCryptoKeySet, CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { makeCryptoService } from 'freedom-crypto-service';

export interface TestingCryptoService extends CryptoService {
  addPublicKeys: (args: { publicKeys: CombinationCryptoKeySet }) => void;
}

export const makeCryptoServiceForTesting = ({ privateKeys }: { privateKeys: PrivateCombinationCryptoKeySet }): TestingCryptoService => {
  const allPublicKeys: Partial<Record<CryptoKeySetId, CombinationCryptoKeySet>> = {
    [privateKeys.id]: privateKeys.publicOnly()
  };

  const cryptoService = makeCryptoService({
    getPrivateCryptoKeySetIds: makeAsyncResultFunc(
      [import.meta.filename, 'getPrivateCryptoKeySetIds'],
      async (_trace): PR<CryptoKeySetId[]> => makeSuccess([privateKeys.id])
    ),

    getPrivateCryptoKeysById: makeAsyncResultFunc(
      [import.meta.filename, 'getPrivateCryptoKeysById'],
      async (trace, id): PR<PrivateCombinationCryptoKeySet, 'not-found'> => {
        if (id === privateKeys.id) {
          return makeSuccess(privateKeys);
        }

        return makeFailure(new InternalStateError(trace, { message: `Key not found with ID: ${id}`, errorCode: 'not-found' }));
      }
    ),

    getPublicCryptoKeysById: makeAsyncResultFunc(
      [import.meta.filename, 'getPublicCryptoKeysById'],
      async (trace, id): PR<CombinationCryptoKeySet, 'not-found'> => {
        if (id === privateKeys.id) {
          return makeSuccess(privateKeys);
        }

        const found = allPublicKeys[id];
        if (found !== undefined) {
          return makeSuccess(found);
        }

        return makeFailure(new InternalStateError(trace, { message: `Key not found with ID: ${id}`, errorCode: 'not-found' }));
      }
    ),

    getMostRecentPrivateCryptoKeys: makeAsyncResultFunc(
      [import.meta.filename, 'getMostRecentPrivateCryptoKeys'],
      async (_trace): PR<PrivateCombinationCryptoKeySet> => makeSuccess(privateKeys)
    )
  });

  const modifiedCryptoService = cryptoService as Partial<TestingCryptoService>;

  modifiedCryptoService.addPublicKeys = ({ publicKeys }) => {
    allPublicKeys[publicKeys.id] = publicKeys;
  };

  return modifiedCryptoService as TestingCryptoService;
};
