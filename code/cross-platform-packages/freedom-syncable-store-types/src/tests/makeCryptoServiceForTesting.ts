/* node:coverage disable */

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { makeCryptoService } from 'freedom-crypto-service';

export const makeCryptoServiceForTesting = ({ privateKeys }: { privateKeys: PrivateCombinationCryptoKeySet }): CryptoService =>
  makeCryptoService({
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

    getMostRecentPrivateCryptoKeys: makeAsyncResultFunc(
      [import.meta.filename, 'getMostRecentPrivateCryptoKeys'],
      async (_trace): PR<PrivateCombinationCryptoKeySet> => makeSuccess(privateKeys)
    )
  });
