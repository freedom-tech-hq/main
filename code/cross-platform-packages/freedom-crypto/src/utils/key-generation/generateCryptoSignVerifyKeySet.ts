import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import type { CryptoKeySetId, PureSigningKeySet, PureVerifyingKeySet, SigningMode } from 'freedom-crypto-data';
import {
  algorithmBySigningMode,
  cryptoKeySetIdInfo,
  preferredSigningMode,
  PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256
} from 'freedom-crypto-data';

export const generateCryptoSignVerifyKeySet = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, id?: CryptoKeySetId, mode: SigningMode = preferredSigningMode): PR<PureSigningKeySet & PureVerifyingKeySet> => {
    id = id ?? cryptoKeySetIdInfo.make(`sv-${makeUuid()}`);

    try {
      switch (mode) {
        case 'RSASSA-PKCS1-v1_5/4096/SHA-256': {
          const rsaKeyPair = await crypto.subtle.generateKey(algorithmBySigningMode[mode], true, ['sign', 'verify']);
          /* node:coverage disable */
          if (rsaKeyPair instanceof CryptoKey) {
            throw new Error('Expected CryptoKeyPair');
          }
          /* node:coverage enable */

          return makeSuccess(new PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256(id, { rsaKeyPair }));
        }
      }
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
