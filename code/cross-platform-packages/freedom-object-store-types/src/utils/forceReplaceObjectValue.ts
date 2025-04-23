import type { FailureResult, PR, PRFunc } from 'freedom-async';
import { callWithRetrySupport, excludeFailureResult, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

import type { StorableObject } from '../types/StorableObject.ts';

const DEFAULT_MAX_ATTEMPTS = 10;

export interface ForceReplaceObjectValueArgs<T, ErrorCodeT extends string> {
  getMutable: PRFunc<StorableObject<T>, ErrorCodeT | 'not-found'>;
  update: PRFunc<undefined, ErrorCodeT | 'not-found' | 'out-of-date', [newValue: StorableObject<T>]>;
  maxAttempts?: number;
}

/** Forcibly replaces the value of an object in a store, as long as a value already exists, without concern for potentially clobbering
 * concurrent updates */
export const forceReplaceObjectValue = async <T, ErrorCodeT extends string>(
  trace: Trace,

  {
    getMutable,
    update,
    maxAttempts = DEFAULT_MAX_ATTEMPTS
  }: {
    getMutable: PRFunc<StorableObject<T>, ErrorCodeT | 'not-found'>;
    update: PRFunc<undefined, ErrorCodeT | 'not-found' | 'out-of-date', [newValue: StorableObject<T>]>;
    maxAttempts?: number;
  },
  newValue: T
): PR<undefined, Exclude<ErrorCodeT | 'not-found', 'out-of-date'>> => {
  const result = await callWithRetrySupport(
    (failure, { attemptCount }) => {
      if (failure.value.errorCode !== 'out-of-date' || attemptCount + 1 >= maxAttempts) {
        return { retry: false };
      }

      return { retry: true, delayMSec: Math.pow(2, attemptCount) };
    },
    async (): PR<undefined, ErrorCodeT | 'not-found' | 'out-of-date'> => {
      const found = await getMutable(trace);
      if (!found.ok) {
        return found as FailureResult<Exclude<ErrorCodeT | 'not-found', 'out-of-date'>>;
      }

      found.value.storedValue = newValue;
      const updated = await update(trace, found.value);
      if (!updated.ok) {
        return updated;
      }

      return makeSuccess(undefined);
    }
  );
  if (!result.ok) {
    return excludeFailureResult(result, 'out-of-date');
  }

  return makeSuccess(undefined);
};
