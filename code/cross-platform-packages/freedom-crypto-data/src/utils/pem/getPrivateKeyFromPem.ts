import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';

import type { PrivatePem } from '../../types/PrivatePem.ts';

export const getPrivateKeyFromPem = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    pem: PrivatePem,
    format: 'pkcs8' | 'raw',
    {
      algorithm,
      usages
    }: {
      algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm;
      usages: Array<'sign' | 'encrypt' | 'decrypt'>;
    }
  ): PR<CryptoKey> => {
    try {
      const privateKeyBuffer = bufferFromPrivatePem(pem);
      return makeSuccess(await crypto.subtle.importKey(format, privateKeyBuffer, algorithm, true, usages));
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);

// Helpers

const bufferFromPrivatePem = (pem: PrivatePem) => {
  const unwrappedPemValue = pem
    .substring(`-----BEGIN PRIVATE KEY-----\n`.length, pem.length - `\n-----END PRIVATE KEY-----`.length)
    .replace(/\n/g, '');
  return Buffer.from(unwrappedPemValue, 'base64');
};
