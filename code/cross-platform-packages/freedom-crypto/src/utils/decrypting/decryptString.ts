import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import type { DecryptingKeySet } from 'freedom-crypto-data';

import { decryptBuffer } from './decryptBuffer.ts';

export const decryptString = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    { encryptedValue, decryptingKeys }: { encryptedValue: Base64String; decryptingKeys: DecryptingKeySet }
  ): PR<string> => {
    try {
      const decrypted = await decryptBuffer(trace, {
        encryptedValue: base64String.toBuffer(encryptedValue),
        decryptingKeys
      });
      if (!decrypted.ok) {
        return decrypted;
      }

      return makeSuccess(Buffer.from(decrypted.value).toString('utf-8'));
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
