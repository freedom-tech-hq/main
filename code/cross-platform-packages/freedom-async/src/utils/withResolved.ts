import isPromise from 'is-promise';
import type { TypeOrPromisedType } from 'yaschema';

import { inline } from './inline.ts';

/**
 * If the specified value is a promise, this waits for the promise to be resolved and then calls the specified callback with the resolved
 * value.  In such a case, this function returns a promise to the result of the callback.
 *
 * If the specified value is not a promise, this immediately calls the specified callback and returns the result.
 */
export const withResolved = <T, ReturnT>(
  value: TypeOrPromisedType<T>,
  callback: (value: T) => TypeOrPromisedType<ReturnT>,
  onError?: (error: any) => TypeOrPromisedType<ReturnT>
): TypeOrPromisedType<ReturnT> => {
  if (isPromise(value)) {
    return inline(async () => {
      try {
        const resolved = await value;
        return await callback(resolved);
      } catch (e) {
        if (onError !== undefined) {
          return await onError(e);
        }

        throw e;
      }
    });
  } else {
    try {
      return callback(value);
    } catch (e) {
      if (onError !== undefined) {
        return onError(e);
      }

      throw e;
    }
  }
};
