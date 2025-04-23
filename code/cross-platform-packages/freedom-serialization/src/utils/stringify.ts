import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { get } from 'lodash-es';
import type { Schema, StringifyOptions, ValidationOptions } from 'yaschema';

export const stringify = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(trace: Trace, value: T, valueSchema: Schema<T>, options?: Omit<StringifyOptions, keyof ValidationOptions>): PR<string> => {
    try {
      const jsonString = await valueSchema.stringifyAsync(value, { ...options, validation: 'hard' });
      return makeSuccess(jsonString);
    } catch (e) {
      const error = get(e, 'error');
      if (typeof error === 'string') {
        return makeFailure(new InternalSchemaValidationError(trace, { message: error }));
      } else {
        return makeFailure(new GeneralError(trace, e));
      }
    }
  }
);
