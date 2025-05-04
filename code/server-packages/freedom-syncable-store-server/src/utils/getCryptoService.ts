import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { type CryptoService } from 'freedom-crypto-service';
import { getServerPrivateKeys } from 'freedom-db';
import { once } from 'lodash-es';

// TODO: Move to freedom-db, rename to get(MailAgent|MailBot|ServerAgent|ServerBot)CryptoService
//   I want to pick the word 'agent' or 'bot' to represent it uses the User's interfaces, but it is not the end user.
//   And then use the picked word everywhere.
//   'agent' is a better choice, isn't it?
export const getCryptoService = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (trace): PR<CryptoService> => {
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
    } satisfies CryptoService);
  })
);
