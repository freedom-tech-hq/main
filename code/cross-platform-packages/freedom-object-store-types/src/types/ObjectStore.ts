import type { PRFunc } from 'freedom-async';
import type { IndexStore } from 'freedom-indexing-types';

import type { ObjectAccessor } from './ObjectAccessor.ts';

export interface ObjectStore<KeyT extends string, T> {
  uid: string;

  keys: IndexStore<KeyT, unknown>;

  /** Gets an accessor to the object with the specified key.  The existence of the object isn't checked. */
  object: (key: KeyT) => ObjectAccessor<T>;

  /** Gets the values for multiple keys */
  getMultiple: PRFunc<{ found: Partial<Record<KeyT, T>>; notFound: KeyT[] }, never, [keys: KeyT[]]>;
}
