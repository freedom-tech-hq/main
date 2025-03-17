import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';

import type { PublicPem } from '../../types/PublicPem.ts';

export const getPublicKeyFromPem = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    pem: PublicPem,
    {
      algorithm,
      usages
    }: {
      algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm;
      usages: Array<'verify' | 'encrypt'>;
    }
  ): PR<CryptoKey> => {
    try {
      const publicKeyBuffer = bufferFromPublicPem(pem);
      return makeSuccess(await crypto.subtle.importKey('spki', publicKeyBuffer, algorithm, true, usages));
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);

// Helpers

const bufferFromPublicPem = (pem: PublicPem) => {
  const unwrappedPemValue = pem
    .substring(`-----BEGIN PUBLIC KEY-----\n`.length, pem.length - `\n-----END PUBLIC KEY-----`.length)
    .replace(/\n/g, '');
  return Buffer.from(unwrappedPemValue, 'base64');
};
