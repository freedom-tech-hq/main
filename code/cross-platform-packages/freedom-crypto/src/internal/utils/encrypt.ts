import { getEnv } from 'freedom-contexts';

import { bufferFromBufferSource } from './bufferFromBufferSource.ts';

export let encrypt = async (
  algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
  key: CryptoKey,
  data: BufferSource
): Promise<ArrayBuffer> => await crypto.subtle.encrypt(algorithm, key, data);

// Replacing encrypt in DEV build mode
DEV: {
  encrypt = async (algorithm, key, data) => {
    if (getEnv('FREEDOM_MOCK_CRYPTO', process.env.FREEDOM_MOCK_CRYPTO) === 'true') {
      const dataBuffer = bufferFromBufferSource(data);

      const mockPrefixBuffer = Buffer.from('MOCK_ENCRYPTED_', 'utf-8');
      const outBuffer = new Uint8Array(mockPrefixBuffer.byteLength + dataBuffer.byteLength);

      let offset = 0;
      outBuffer.set(mockPrefixBuffer, offset);
      offset += mockPrefixBuffer.byteLength;

      outBuffer.set(dataBuffer, offset);
      offset += dataBuffer.byteLength;

      return outBuffer;
    } else {
      return await crypto.subtle.encrypt(algorithm, key, data);
    }
  };
}
