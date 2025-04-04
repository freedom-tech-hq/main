import { getEnv } from 'freedom-contexts';
import type { CryptoKeySetId } from 'freedom-crypto-data';

import { bufferFromBufferSource } from './bufferFromBufferSource.ts';

export let verify = async (
  _cryptoKeySetId: CryptoKeySetId,
  algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
  key: CryptoKey,
  signature: BufferSource,
  data: BufferSource
): Promise<boolean> => await crypto.subtle.verify(algorithm, key, signature, data);

// Replacing verify in DEV build mode
DEV: {
  verify = async (cryptoKeySetId, algorithm, key, signature, data) => {
    if (getEnv('FREEDOM_MOCK_CRYPTO', process.env.FREEDOM_MOCK_CRYPTO) === 'true') {
      const signatureBuffer = bufferFromBufferSource(signature);

      const expectedMockValue = Buffer.from(`MOCK_SIGNATURE_${cryptoKeySetId}`, 'utf-8');
      return signatureBuffer.equals(expectedMockValue);
    } else {
      return await crypto.subtle.verify(algorithm, key, signature, data);
    }
  };
}
