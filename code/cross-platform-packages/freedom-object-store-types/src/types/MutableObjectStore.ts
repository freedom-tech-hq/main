import type { MutableObjectAccessor } from './MutableObjectAccessor.ts';
import type { ObjectStore } from './ObjectStore.ts';

export interface MutableObjectStore<KeyT extends string, T> extends ObjectStore<KeyT, T> {
  /** Gets an accessor to the object with the specified key.  The existence of the object isn't checked. */
  mutableObject: (key: KeyT) => MutableObjectAccessor<T>;
}
