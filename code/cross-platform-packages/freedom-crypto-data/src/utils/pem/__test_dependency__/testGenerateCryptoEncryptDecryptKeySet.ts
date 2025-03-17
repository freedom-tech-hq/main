import { makeUuid } from 'freedom-contexts';

import { asymmetricalAlgorithmByEncryptionMode } from '../../../consts/asymmetricalAlgorithmByEncryptionMode.ts';
import { PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm } from '../../../types/crypto-key-sets/specific/PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm.ts';
import { cryptoKeySetIdInfo } from '../../../types/CryptoKeySetId.ts';

export const testGenerateCryptoEncryptDecryptKeySet = async () => {
  const rsaKeyPair = await crypto.subtle.generateKey(asymmetricalAlgorithmByEncryptionMode['RSA-OAEP/4096/SHA-256'], true, [
    'encrypt',
    'decrypt'
  ]);
  /* node:coverage disable */
  if (rsaKeyPair instanceof CryptoKey) {
    throw new Error('Expected CryptoKeyPair');
  }
  /* node:coverage enable */

  const id = cryptoKeySetIdInfo.make(makeUuid());
  return new PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm(id, { rsaKeyPair });
};
