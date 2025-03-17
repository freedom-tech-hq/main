import type { PRFunc } from 'freedom-async';

export interface ObjectAccessor<T> {
  /** Determines if the object exists or not */
  exists: PRFunc<boolean>;

  /** Gets the current value of the object. */
  get: PRFunc<T, 'not-found'>;
}
