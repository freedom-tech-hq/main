import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { type UserKeys } from 'freedom-crypto-service';
import { once } from 'lodash-es';

import * as config from '../../../config.ts';

export const getMailAgentUserKeys = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (_trace): PR<UserKeys> => {
    const serverPrivateKeys = config.MAIL_AGENT_USER_KEYS;

    return makeSuccess({
      getPrivateCryptoKeySetIds: makeAsyncResultFunc(
        [import.meta.filename, 'getPrivateCryptoKeySetIds'],
        async (_trace): PR<CryptoKeySetId[]> => makeSuccess([serverPrivateKeys.id])
      ),

      getPrivateCryptoKeySet: makeAsyncResultFunc(
        [import.meta.filename, 'getPrivateCryptoKeySet'],
        async (trace, id?: CryptoKeySetId): PR<PrivateCombinationCryptoKeySet, 'not-found'> => {
          if (id === undefined || id === serverPrivateKeys.id) {
            return makeSuccess(serverPrivateKeys);
          }

          return makeFailure(new NotFoundError(trace, { message: `No signing key found with ID: ${id}`, errorCode: 'not-found' }));
        }
      )
    } satisfies UserKeys);
  })
);
