import type { PRFunc } from 'freedom-async';

import type { ObjectAccessor } from './ObjectAccessor.ts';
import type { StorableObject } from './StorableObject.ts';

export interface MutableObjectAccessor<T> extends ObjectAccessor<T> {
  /**
   * Creates a new object.
   *
   * Returns a 'conflict' failure if the object already exists.
   */
  create: PRFunc<T, 'conflict', [initialValue: T]>;

  /** Marks the object for deletion.  A future sweep operation on the object store will actually delete the entry.  Object stores may
   * support different retention periods. */
  delete: PRFunc<undefined, 'not-found'>;

  /** Gets the current value of the object wrapped so that safe updates may be attempted. */
  getMutable: PRFunc<StorableObject<T>, 'not-found'>;

  /**
   * Updates the object with a new value.  The `updateCount` should be the same as what's currently stored.  Updates are atomic.
   *
   * Returns an 'out-of-date' failure if `updateCount` doesn't match the stored value -- e.g. if another process updated the same object
   * before this process.
   *
   * On success, the `updateCount` of the stored object will be incremented.
   */
  update: PRFunc<undefined, 'not-found' | 'out-of-date', [newValue: StorableObject<T>]>;
}
