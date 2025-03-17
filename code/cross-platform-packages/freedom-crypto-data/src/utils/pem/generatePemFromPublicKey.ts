import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';

import type { PublicPem } from '../../types/PublicPem.ts';

export const generatePemFromPublicKey = makeAsyncResultFunc([import.meta.filename], async (trace, key: CryptoKey): PR<PublicPem> => {
  try {
    const exportedPublicKey = await crypto.subtle.exportKey('spki', key);
    const rawBase64PublicKey = Buffer.from(exportedPublicKey).toString('base64');
    return makeSuccess(
      `-----BEGIN PUBLIC KEY-----\n${rawBase64PublicKey.replace(/(.{64})/g, '$1\n')}\n-----END PUBLIC KEY-----` as PublicPem
    );
  } catch (e) {
    /* node:coverage ignore next */
    return makeFailure(new GeneralError(trace, e));
  }
});
