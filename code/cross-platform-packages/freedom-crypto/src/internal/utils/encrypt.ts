import { getEnv } from 'freedom-contexts';

import { bufferFromBufferSource } from './bufferFromBufferSource.ts';

export const encrypt = async (
  algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
  key: CryptoKey,
  data: BufferSource
): Promise<ArrayBuffer> => {
  DEV: {
    console.log('FOOBARBLA DEV MODE', getEnv('FREEDOM_MOCK_CRYPTO', process.env.FREEDOM_MOCK_CRYPTO) === 'true');
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
  }
  PROD: {
    console.log('FOOBARBLA PROD MODE');
    return await crypto.subtle.encrypt(algorithm, key, data);
  }
};
