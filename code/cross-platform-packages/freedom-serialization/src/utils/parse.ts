import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { get } from 'lodash-es';
import type { Schema } from 'yaschema';

export const parse = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(trace: Trace, jsonString: string, valueSchema: Schema<T>): PR<T> => {
    try {
      const parsed = await valueSchema.parseAsync(jsonString, { validation: 'hard' });
      return makeSuccess(parsed);
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
