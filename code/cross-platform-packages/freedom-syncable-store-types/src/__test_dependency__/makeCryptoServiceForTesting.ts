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

export const makeCryptoServiceForTesting = ({ cryptoKeys }: { cryptoKeys: PrivateCombinationCryptoKeySet }): TestingCryptoService => {
  const allPublicKeys: Partial<Record<CryptoKeySetId, CombinationCryptoKeySet>> = {};

  const cryptoService = makeCryptoService({
    getCryptoKeySetIds: makeAsyncResultFunc(
      [import.meta.filename, 'getCryptoKeySetIds'],
      async (_trace): PR<CryptoKeySetId[]> => makeSuccess([cryptoKeys.id])
    ),

    getCryptoKeysById: makeAsyncResultFunc(
      [import.meta.filename, 'getCryptoKeysById'],
      async (trace, id): PR<PrivateCombinationCryptoKeySet, 'not-found'> => {
        if (id === cryptoKeys.id) {
          return makeSuccess(cryptoKeys);
        }

        return makeFailure(new InternalStateError(trace, { message: `Key not found with ID: ${id}`, errorCode: 'not-found' }));
      }
    ),

    getPublicCryptoKeysById: makeAsyncResultFunc(
      [import.meta.filename, 'getPublicCryptoKeysById'],
      async (trace, id): PR<CombinationCryptoKeySet, 'not-found'> => {
        if (id === cryptoKeys.id) {
          return makeSuccess(cryptoKeys);
        }

        const found = allPublicKeys[id];
        if (found !== undefined) {
          return makeSuccess(found);
        }

        return makeFailure(new InternalStateError(trace, { message: `Key not found with ID: ${id}`, errorCode: 'not-found' }));
      }
    ),

    getMostRecentCryptoKeys: makeAsyncResultFunc(
      [import.meta.filename, 'getMostRecentCryptoKeys'],
      async (_trace): PR<PrivateCombinationCryptoKeySet> => makeSuccess(cryptoKeys)
    )
  });

  const modifiedCryptoService = cryptoService as Partial<TestingCryptoService>;

  modifiedCryptoService.addPublicKeys = ({ publicKeys }) => {
    allPublicKeys[publicKeys.id] = publicKeys;
  };

  return modifiedCryptoService as TestingCryptoService;
};
