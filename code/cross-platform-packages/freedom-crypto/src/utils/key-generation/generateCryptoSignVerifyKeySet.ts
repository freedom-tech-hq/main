import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess, Pool } from 'freedom-async';
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
          const rsaKeyPair = await rsaSsaPkcs1V154096Sha256Pool.get();
          if (!rsaKeyPair.ok) {
            return rsaKeyPair;
          }

          return makeSuccess(new PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256(id, { rsaKeyPair: rsaKeyPair.value }));
        }
      }
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);

// Helpers

const rsaSsaPkcs1V154096Sha256Pool = new Pool<CryptoKeyPair>(
  [import.meta.filename, 'rsaSsaPkcs1V154096Sha256Pool'],
  4,
  makeAsyncResultFunc([], async (_trace): PR<CryptoKeyPair> => {
    const rsaKeyPair = await crypto.subtle.generateKey(algorithmBySigningMode['RSASSA-PKCS1-v1_5/4096/SHA-256'], true, ['sign', 'verify']);
    /* node:coverage disable */
    if (rsaKeyPair instanceof CryptoKey) {
      throw new Error('Expected CryptoKeyPair');
    }
    /* node:coverage enable */

    return makeSuccess(rsaKeyPair);
  })
);
