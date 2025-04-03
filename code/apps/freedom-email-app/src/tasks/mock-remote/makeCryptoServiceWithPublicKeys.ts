import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError, NotFoundError } from 'freedom-common-errors';
import type { CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { type CryptoService, makeCryptoService } from 'freedom-crypto-service';

export const makeCryptoServiceForMockRemote = (): CryptoService =>
  makeCryptoService({
    getPrivateCryptoKeySetIds: makeAsyncResultFunc(
      [import.meta.filename, 'getPrivateCryptoKeySetIds'],
      async (_trace): PR<CryptoKeySetId[]> => makeSuccess([])
    ),

    getPrivateCryptoKeysById: makeAsyncResultFunc(
      [import.meta.filename, 'getPrivateCryptoKeysById'],
      async (trace, id): PR<PrivateCombinationCryptoKeySet, 'not-found'> =>
        makeFailure(new InternalStateError(trace, { message: `Key not found with ID: ${id}`, errorCode: 'not-found' }))
    ),

    getMostRecentPrivateCryptoKeys: makeAsyncResultFunc(
      [import.meta.filename, 'getMostRecentPrivateCryptoKeys'],
      async (trace): PR<PrivateCombinationCryptoKeySet> =>
        makeFailure(new NotFoundError(trace, { message: "Private keys aren't available in the mock remote" }))
    )
  });
