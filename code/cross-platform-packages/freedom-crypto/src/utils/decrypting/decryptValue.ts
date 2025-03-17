import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { DecryptingKeySet } from 'freedom-crypto-data';
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

      const deserialization = await valueSchema.deserializeAsync(serializedValue);
      if (deserialization.error !== undefined) {
        return makeFailure(new InternalSchemaValidationError(trace, { message: deserialization.error }));
      }

      return makeSuccess(deserialization.deserialized);
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
