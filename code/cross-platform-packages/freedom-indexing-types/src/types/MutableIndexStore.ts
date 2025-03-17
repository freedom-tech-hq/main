import type { PRFunc } from 'freedom-async';

import type { IndexStore } from './IndexStore.ts';

/** For automatically managed index types, these methods may have no effect  */
export interface MutableIndexStore<KeyT extends string, IndexedValueT> extends IndexStore<KeyT, IndexedValueT> {
  /** Adds to the index */
  addToIndex: PRFunc<undefined, never, [key: KeyT, value: IndexedValueT]>;

  /** Removes from the index */
  removeFromIndex: PRFunc<undefined, never, [key: KeyT]>;
}
