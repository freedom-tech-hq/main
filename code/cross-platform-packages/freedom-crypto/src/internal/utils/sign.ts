import { getEnv } from 'freedom-contexts';
import type { CryptoKeySetId } from 'freedom-crypto-data';

export let sign = async (
  _cryptoKeySetId: CryptoKeySetId,
  algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
  key: CryptoKey,
  data: BufferSource
): Promise<ArrayBuffer> => await crypto.subtle.sign(algorithm, key, data);

// Replacing sign in DEV build mode
DEV: {
  sign = async (cryptoKeySetId, algorithm, key, data): Promise<ArrayBuffer> => {
    if (getEnv('FREEDOM_MOCK_CRYPTO', process.env.FREEDOM_MOCK_CRYPTO) === 'true') {
      return Buffer.from(`MOCK_SIGNATURE_${cryptoKeySetId}`, 'utf-8');
    } else {
      return await crypto.subtle.sign(algorithm, key, data);
    }
  };
}
