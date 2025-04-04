import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { JsonValue, Schema } from 'yaschema';

export const deserialize = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(trace: Trace, serializedValue: { serializedValue: JsonValue; valueSchema: Schema<T> }): PR<T> => {
    const deserialization = await serializedValue.valueSchema.deserializeAsync(serializedValue.serializedValue, {
      validation: 'hard'
    });
    /* node:coverage disable */
    if (deserialization.error !== undefined) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: deserialization.error }));
    }
    /* node:coverage enable */

    return makeSuccess(deserialization.deserialized);
  }
);
