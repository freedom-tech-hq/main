import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { merge } from 'lodash-es';
import type { TypeOrPromisedType } from 'yaschema';

import type { MutableObjectAccessor } from '../types/MutableObjectAccessor.ts';

const MAX_ATTEMPTS = 10;

export const updateObject = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(
    trace: Trace,
    objectAccessor: MutableObjectAccessor<T>,
    update: ((readValue: T) => TypeOrPromisedType<Partial<T> | undefined>) | Partial<T>
  ): PR<undefined, 'not-found'> => {
    let attempts = 0;
    while (attempts < MAX_ATTEMPTS) {
      const found = await objectAccessor.getMutable(trace);
      /* node:coverage disable */
      if (!found.ok) {
        return found;
      }
      /* node:coverage enable */

      const updates = typeof update === 'function' ? await update(found.value.storedValue) : update;
      if (updates === undefined || Object.entries(updates).length === 0) {
        return makeSuccess(undefined); // No updates required
      }

      merge(found.value.storedValue, updates);

      const updated = await objectAccessor.update(trace, found.value);
      if (!updated.ok) {
        // Will retry if we have out-of-date data
        if (updated.value.errorCode === 'out-of-date') {
          attempts += 1;
          continue;
        }

        return excludeFailureResult(updated, 'out-of-date');
      }

      return makeSuccess(undefined);
    }

    return makeFailure(
      new InternalStateError(trace, {
        message: `Failed to update object after ${MAX_ATTEMPTS} attempts.  Too many processes are simultaneously updating this object`
      })
    );
  }
);
