import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { type UserKeys } from 'freedom-crypto-service';
import { once } from 'lodash-es';

import { getServerPrivateKeys } from './getServerPrivateKeys.ts';

export const getMailAgentUserKeys = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (trace): PR<UserKeys> => {
    const serverPrivateKeys = await getServerPrivateKeys(trace);
    if (!serverPrivateKeys.ok) {
      return generalizeFailureResult(trace, serverPrivateKeys, 'not-found');
    }

    return makeSuccess({
      getPrivateCryptoKeySetIds: makeAsyncResultFunc(
        [import.meta.filename, 'getPrivateCryptoKeySetIds'],
        async (_trace): PR<CryptoKeySetId[]> => makeSuccess([serverPrivateKeys.value.id])
      ),

      getPrivateCryptoKeySet: makeAsyncResultFunc(
        [import.meta.filename, 'getPrivateCryptoKeySet'],
        async (trace, id?: CryptoKeySetId): PR<PrivateCombinationCryptoKeySet, 'not-found'> => {
          if (id === undefined || id === serverPrivateKeys.value.id) {
            return makeSuccess(serverPrivateKeys.value);
          }

          return makeFailure(new NotFoundError(trace, { message: `No signing key found with ID: ${id}`, errorCode: 'not-found' }));
        }
      )
    } satisfies UserKeys);
  })
);
