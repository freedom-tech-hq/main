import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { SerializedValue } from 'freedom-basic-data';
import { makeSerializedValue } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { Schema } from 'yaschema';

export const serialize = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(trace: Trace, value: T, valueSchema: Schema<T>): PR<SerializedValue<T>> => {
    const serialization = await valueSchema.serializeAsync(value);
    /* node:coverage disable */
    if (serialization.error !== undefined) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: serialization.error }));
    }
    /* node:coverage enable */

    return makeSuccess(makeSerializedValue({ serializedValue: serialization.serialized, valueSchema: valueSchema }));
  }
);
