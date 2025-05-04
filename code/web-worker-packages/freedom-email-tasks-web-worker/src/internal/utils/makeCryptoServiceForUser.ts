import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { makeUserKeys } from 'freedom-crypto-service';
import type { EmailCredential } from 'freedom-email-user';

export const makeCryptoServiceForUser = (credential: EmailCredential): UserKeys =>
  makeUserKeys({
    getPrivateCryptoKeySetIds: makeAsyncResultFunc(
      [import.meta.filename, 'getPrivateCryptoKeySetIds'],
      async (_trace): PR<CryptoKeySetId[]> => makeSuccess([credential.privateKeys.id])
    ),

    getPrivateCryptoKeysById: makeAsyncResultFunc(
      [import.meta.filename, 'getPrivateCryptoKeysById'],
      async (trace, id): PR<PrivateCombinationCryptoKeySet, 'not-found'> => {
        if (id !== credential.privateKeys.id) {
          return makeFailure(new InternalStateError(trace, { message: `Key not found with ID: ${id}`, errorCode: 'not-found' }));
        }

        return makeSuccess(credential.privateKeys);
      }
    ),

    getMostRecentPrivateCryptoKeys: makeAsyncResultFunc(
      [import.meta.filename, 'getMostRecentPrivateCryptoKeys'],
      async (_trace): PR<PrivateCombinationCryptoKeySet> => makeSuccess(credential.privateKeys)
    )
  });
