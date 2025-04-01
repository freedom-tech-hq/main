import { getEnv } from 'freedom-contexts';
import type { CryptoKeySetId } from 'freedom-crypto-data';

export const sign = async (
  cryptoKeySetId: CryptoKeySetId,
  algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
  key: CryptoKey,
  data: BufferSource
): Promise<ArrayBuffer> => {
  DEV: {
    if (getEnv('FREEDOM_MOCK_CRYPTO', process.env.FREEDOM_MOCK_CRYPTO) === 'true') {
      return Buffer.from(`MOCK_SIGNATURE_${cryptoKeySetId}`, 'utf-8');
    } else {
      return await crypto.subtle.sign(algorithm, key, data);
    }
  }
  PROD: {
    return await crypto.subtle.sign(algorithm, key, data);
  }
};
