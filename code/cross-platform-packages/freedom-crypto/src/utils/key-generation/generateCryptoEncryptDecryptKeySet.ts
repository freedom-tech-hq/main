import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import type { EncryptionMode, PureDecryptingKeySet, PureEncryptingKeySet } from 'freedom-crypto-data';
import {
  asymmetricalAlgorithmByEncryptionMode,
  cryptoKeySetIdInfo,
  preferredEncryptionMode,
  PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm
} from 'freedom-crypto-data';

export const generateCryptoEncryptDecryptKeySet = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, mode: EncryptionMode = preferredEncryptionMode): PR<PureEncryptingKeySet & PureDecryptingKeySet> => {
    const id = cryptoKeySetIdInfo.make(`ed-${makeUuid()}`);

    try {
      switch (mode) {
        case 'RSA-OAEP/4096/SHA-256+AES/256/GCM': {
          const rsaKeyPair = await crypto.subtle.generateKey(asymmetricalAlgorithmByEncryptionMode['RSA-OAEP/4096/SHA-256'], true, [
            'encrypt',
            'decrypt'
          ]);
          /* node:coverage disable */
          if (rsaKeyPair instanceof CryptoKey) {
            throw new Error('Expected CryptoKeyPair');
          }
          /* node:coverage enable */

          return makeSuccess(new PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm(id, { rsaKeyPair }));
        }
      }
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
