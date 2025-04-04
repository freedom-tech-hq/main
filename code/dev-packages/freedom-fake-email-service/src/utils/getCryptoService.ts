import type { PR } from 'freedom-async';
import { computeAsyncOnce, makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import type { CombinationCryptoKeySet, CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { type CryptoService } from 'freedom-crypto-service';

import { getPrivateKeyStore } from './getPrivateKeyStore.ts';
import { getPublicKeyStore } from './getPublicKeyStore.ts';

const secretKey = makeUuid();

export const getCryptoService = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace) =>
    await computeAsyncOnce([import.meta.filename], secretKey, async (trace): PR<CryptoService> => {
      const publicKeyStore = await uncheckedResult(getPublicKeyStore(trace));
      const privateKeyStore = await uncheckedResult(getPrivateKeyStore(trace));

      const serverPrivateKeys = await privateKeyStore.object('server-keys').get(trace);
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
        ),

        getPublicCryptoKeySetForId: makeAsyncResultFunc(
          [import.meta.filename, 'getPublicCryptoKeySetForId'],
          async (trace, id: CryptoKeySetId): PR<CombinationCryptoKeySet, 'not-found'> => {
            const cryptoKeys = await publicKeyStore.object(id).get(trace);
            if (!cryptoKeys.ok) {
              return cryptoKeys;
            }

            return makeSuccess(cryptoKeys.value);
          }
        )
      } satisfies CryptoService);
    })
);
