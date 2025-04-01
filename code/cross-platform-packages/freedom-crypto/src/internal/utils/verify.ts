import { getEnv } from 'freedom-contexts';
import type { CryptoKeySetId } from 'freedom-crypto-data';

import { bufferFromBufferSource } from './bufferFromBufferSource.ts';

export const verify = async (
  cryptoKeySetId: CryptoKeySetId,
  algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
  key: CryptoKey,
  signature: BufferSource,
  data: BufferSource
): Promise<boolean> => {
  DEV: {
    if (getEnv('FREEDOM_MOCK_CRYPTO', process.env.FREEDOM_MOCK_CRYPTO) === 'true') {
      const signatureBuffer = bufferFromBufferSource(signature);

      const expectedMockValue = Buffer.from(`MOCK_SIGNATURE_${cryptoKeySetId}`, 'utf-8');
      return signatureBuffer.equals(expectedMockValue);
    } else {
      return await crypto.subtle.verify(algorithm, key, signature, data);
    }
  }
  PROD: {
    return await crypto.subtle.verify(algorithm, key, signature, data);
  }
};
