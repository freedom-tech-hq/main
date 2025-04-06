import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import type { EncryptingKeySet, EncryptionMode } from 'freedom-crypto-data';
import { preferredEncryptionMode } from 'freedom-crypto-data';
import { serialize } from 'freedom-serialization';
import type { Schema } from 'yaschema';

import { encryptString } from './encryptString.ts';

export const encryptValue = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(
    trace: Trace,
    {
      mode = preferredEncryptionMode,
      value,
      valueSchema,
      encryptingKeys,
      includeKeyId = true
    }: { mode?: EncryptionMode; value: T; valueSchema: Schema<T>; encryptingKeys: EncryptingKeySet; includeKeyId?: boolean }
  ): PR<Base64String> => {
    try {
      const serialization = await serialize(trace, value, valueSchema);
      if (!serialization.ok) {
        return serialization;
      }

      const jsonString = JSON.stringify(serialization.value.serializedValue);

      return await encryptString(trace, { mode, value: jsonString, encryptingKeys, includeKeyId });
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
