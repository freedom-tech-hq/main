import type { PR } from 'freedom-async';
import { computeAsyncOnce, makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import type { CryptoKeySetId, DecryptingKeySet, EncryptingKeySet, SigningKeySet, VerifyingKeySet } from 'freedom-crypto-data';
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

        getEncryptingKeySetForId: makeAsyncResultFunc(
          [import.meta.filename, 'getEncryptingKeySetForId'],
          async (trace, id: CryptoKeySetId): PR<EncryptingKeySet, 'not-found'> => {
            const cryptoKeys = await publicKeyStore.object(id).get(trace);
            if (!cryptoKeys.ok) {
              return cryptoKeys;
            }

            return makeSuccess(cryptoKeys.value.forEncrypting);
          }
        ),

        getVerifyingKeySetForId: makeAsyncResultFunc(
          [import.meta.filename, 'getVerifyingKeySetForId'],
          async (trace, id: CryptoKeySetId): PR<VerifyingKeySet, 'not-found'> => {
            const cryptoKeys = await publicKeyStore.object(id).get(trace);
            if (!cryptoKeys.ok) {
              return cryptoKeys;
            }

            return makeSuccess(cryptoKeys.value.forVerifying);
          }
        ),

        getSigningKeySet: makeAsyncResultFunc(
          [import.meta.filename, 'getSigningKeySet'],
          async (trace, id?: CryptoKeySetId): PR<SigningKeySet, 'not-found'> => {
            if (id === undefined || id === serverPrivateKeys.value.id) {
              return makeSuccess(serverPrivateKeys.value.forSigning);
            }

            return makeFailure(new NotFoundError(trace, { message: `No signing key found with ID: ${id}`, errorCode: 'not-found' }));
          }
        ),

        getDecryptingKeySet: makeAsyncResultFunc(
          [import.meta.filename, 'getDecryptingKeySet'],
          async (trace, id?: CryptoKeySetId): PR<DecryptingKeySet, 'not-found'> => {
            if (id === undefined || id === serverPrivateKeys.value.id) {
              return makeSuccess(serverPrivateKeys.value.forDecrypting);
            }

            return makeFailure(new NotFoundError(trace, { message: `No decrypting key found with ID: ${id}`, errorCode: 'not-found' }));
          }
        )
      } satisfies CryptoService);
    })
);
