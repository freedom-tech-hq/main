import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import type { EncryptingKeySet, EncryptionMode } from 'freedom-crypto-data';
import { preferredEncryptionMode } from 'freedom-crypto-data';

import { encryptBuffer } from './encryptBuffer.ts';

export const encryptString = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    {
      mode = preferredEncryptionMode,
      value,
      encryptingKeys,
      includeKeyId = true
    }: { mode?: EncryptionMode; value: string; encryptingKeys: EncryptingKeySet; includeKeyId?: boolean }
  ): PR<Base64String> => {
    try {
      const stringBuffer = Buffer.from(value, 'utf-8');

      const encryptedBuffer = await encryptBuffer(trace, { mode, value: stringBuffer, encryptingKeys, includeKeyId });
      /* node:coverage disable */
      if (!encryptedBuffer.ok) {
        return encryptedBuffer;
      }
      /* node:coverage enable */

      return makeSuccess(base64String.makeWithBuffer(encryptedBuffer.value));
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
