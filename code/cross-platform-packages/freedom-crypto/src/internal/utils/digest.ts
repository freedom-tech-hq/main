import { getEnv } from 'freedom-contexts';

import { bufferFromBufferSource } from './bufferFromBufferSource.ts';

export const digest = async (algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> => {
  DEV: {
    if (getEnv('FREEDOM_MOCK_CRYPTO', process.env.FREEDOM_MOCK_CRYPTO) === 'true') {
      const dataBuffer = bufferFromBufferSource(data).subarray(0, 16);

      const actualDigest = await crypto.subtle.digest(algorithm, data);

      const outBuffer = new Uint8Array(actualDigest.byteLength + dataBuffer.byteLength);

      let offset = 0;
      outBuffer.set(Buffer.from(actualDigest), offset);
      offset += actualDigest.byteLength;

      outBuffer.set(dataBuffer, offset);
      offset += dataBuffer.byteLength;

      return outBuffer;
    } else {
      return await crypto.subtle.digest(algorithm, data);
    }
  }
  PROD: {
    return await crypto.subtle.digest(algorithm, data);
  }
};
