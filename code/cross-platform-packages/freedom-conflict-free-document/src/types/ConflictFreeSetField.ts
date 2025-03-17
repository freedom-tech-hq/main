import type { ConflictFreeDocumentField } from './ConflictFreeDocumentField.ts';

export interface ConflictFreeSetField<ValueT extends string> extends ConflictFreeDocumentField<ConflictFreeSetField<ValueT>> {
  /** Adds the specified values to the set */
  readonly add: (...value: ValueT[]) => void;

  /** Deletes all items */
  readonly clear: () => void;

  /** Deletes specified values from the set */
  readonly delete: (...value: ValueT[]) => void;

  /** Determines if the specified value is in the set */
  readonly has: (value: ValueT) => boolean;

  /** Gets the number of items in the set */
  readonly getSize: () => number;

  /** Return an iterator over the values */
  readonly iterator: () => IterableIterator<ValueT>;
}
