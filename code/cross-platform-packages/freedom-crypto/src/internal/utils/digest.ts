import { getEnv } from 'freedom-contexts';

import { bufferFromBufferSource } from './bufferFromBufferSource.ts';

export let digest = async (algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> =>
  await crypto.subtle.digest(algorithm, data);

// Replacing digest in DEV build mode
DEV: {
  digest = async (algorithm, data) => {
    if (getEnv('FREEDOM_MOCK_CRYPTO', process.env.FREEDOM_MOCK_CRYPTO) === 'true') {
      const dataBuffer = bufferFromBufferSource(data).subarray(0, 16);

      const actualDigest = await crypto.subtle.digest(algorithm, data);

      const mockPrefixBuffer = Buffer.from('MOCK_DIGEST_', 'utf-8');
      const outBuffer = new Uint8Array(mockPrefixBuffer.byteLength + actualDigest.byteLength + dataBuffer.byteLength);

      let offset = 0;
      outBuffer.set(mockPrefixBuffer, offset);
      offset += mockPrefixBuffer.byteLength;

      outBuffer.set(Buffer.from(actualDigest), offset);
      offset += actualDigest.byteLength;

      outBuffer.set(dataBuffer, offset);
      offset += dataBuffer.byteLength;

      return outBuffer;
    } else {
      return await crypto.subtle.digest(algorithm, data);
    }
  };
}
