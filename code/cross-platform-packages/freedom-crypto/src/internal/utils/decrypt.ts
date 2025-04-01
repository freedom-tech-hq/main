import { getEnv } from 'freedom-contexts';

import { bufferFromBufferSource } from './bufferFromBufferSource.ts';

export const decrypt = async (
  algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
  key: CryptoKey,
  data: BufferSource
): Promise<ArrayBuffer> => {
  DEV: {
    if (getEnv('FREEDOM_MOCK_CRYPTO', process.env.FREEDOM_MOCK_CRYPTO) === 'true') {
      const dataBuffer = bufferFromBufferSource(data);

      const mockPrefixBuffer = Buffer.from('MOCK_ENCRYPTED_', 'utf-8');
      if (dataBuffer.subarray(0, mockPrefixBuffer.byteLength).equals(mockPrefixBuffer)) {
        return dataBuffer.subarray(mockPrefixBuffer.byteLength);
      } else {
        return await crypto.subtle.decrypt(algorithm, key, data);
      }
    } else {
      return await crypto.subtle.decrypt(algorithm, key, data);
    }
  }
  PROD: {
    return await crypto.subtle.decrypt(algorithm, key, data);
  }
};
