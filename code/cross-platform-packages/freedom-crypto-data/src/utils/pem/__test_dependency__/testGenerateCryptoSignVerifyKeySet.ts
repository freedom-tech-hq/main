import { makeUuid } from 'freedom-contexts';

import { algorithmBySigningMode } from '../../../consts/algorithmBySigningMode.ts';
import { PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256 } from '../../../types/crypto-key-sets/specific/PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256.ts';
import { cryptoKeySetIdInfo } from '../../../types/CryptoKeySetId.ts';

export const testGenerateCryptoSignVerifyKeySet = async () => {
  const rsaKeyPair = await crypto.subtle.generateKey(algorithmBySigningMode['RSASSA-PKCS1-v1_5/4096/SHA-256'], true, ['sign', 'verify']);
  /* node:coverage disable */
  if (rsaKeyPair instanceof CryptoKey) {
    throw new Error('Expected CryptoKeyPair');
  }
  /* node:coverage enable */

  const id = cryptoKeySetIdInfo.make(makeUuid());
  return new PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256(id, { rsaKeyPair });
};
