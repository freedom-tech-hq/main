import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';

import type { PrivatePem } from '../../types/PrivatePem.ts';

export const generatePemFromPrivateKey = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, key: CryptoKey, format: 'pkcs8' | 'raw'): PR<PrivatePem> => {
    try {
      const exportedPrivateKey = await crypto.subtle.exportKey(format, key);
      const rawBase64PrivateKey = Buffer.from(exportedPrivateKey).toString('base64');
      return makeSuccess(
        `-----BEGIN PRIVATE KEY-----\n${rawBase64PrivateKey.replace(/(.{64})/g, '$1\n')}\n-----END PRIVATE KEY-----` as PrivatePem
      );
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
