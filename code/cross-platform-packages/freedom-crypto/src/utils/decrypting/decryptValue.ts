import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import type { DecryptingKeySet } from 'freedom-crypto-data';
import { deserialize } from 'freedom-serialization';
import type { JsonValue, Schema } from 'yaschema';

import { decryptString } from './decryptString.ts';

export const decryptValue = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(
    trace: Trace,
    {
      encryptedValue,
      valueSchema,
      decryptingKeys
    }: {
      encryptedValue: Base64String;
      valueSchema: Schema<T>;
      decryptingKeys: DecryptingKeySet;
    }
  ): PR<T> => {
    try {
      const decryptedString = await decryptString(trace, { encryptedValue, decryptingKeys });
      if (!decryptedString.ok) {
        return decryptedString;
      }

      const serializedValue = JSON.parse(decryptedString.value) as JsonValue;

      const deserialization = await deserialize(trace, { serializedValue, valueSchema });
      if (!deserialization.ok) {
        return deserialization;
      }

      return makeSuccess(deserialization.value);
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
