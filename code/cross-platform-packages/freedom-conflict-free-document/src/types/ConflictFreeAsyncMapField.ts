import type { ConflictFreeDocumentField } from './ConflictFreeDocumentField.ts';

export interface ConflictFreeAsyncMapField<KeyT extends string, ValueT>
  extends ConflictFreeDocumentField<ConflictFreeAsyncMapField<KeyT, ValueT>> {
  /** Deletes all entries */
  readonly clear: () => void;

  /** Deletes the entry with the specified key */
  readonly delete: (key: KeyT) => void;

  /** Return an iterator over the entries, optionally over a specified key range and order */
  readonly entries: (range?: [KeyT | undefined, KeyT | undefined], reverse?: boolean) => IterableIterator<[KeyT, Promise<ValueT>]>;

  /** Gets the value of the entry with the specified key */
  readonly get: (key: KeyT) => Promise<ValueT | undefined>;

  /** Gets the number of entries in the map */
  readonly getSize: () => number;

  /** Returns `true` if the map contains an entry for the specified key  */
  readonly has: (key: KeyT) => boolean;

  /** Returns `true` if the map is empty */
  readonly isEmpty: () => boolean;

  /** Gets an iterator over the keys (inclusive on both sides) in the map, optionally over a specified key range and order */
  readonly keys: (range?: [KeyT | undefined, KeyT | undefined], reverse?: boolean) => IterableIterator<KeyT>;

  /** Sets the value of the entry with the specified key */
  readonly set: (key: KeyT, value: ValueT) => Promise<void>;
}
