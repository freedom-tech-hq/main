import type { ConflictFreeDocumentField } from './ConflictFreeDocumentField.ts';

export interface ConflictFreeArrayField<ValueT> extends ConflictFreeDocumentField<ConflictFreeArrayField<ValueT>> {
  /** Inserts a new set of values at the end */
  readonly append: (newContent: ValueT[]) => void;

  /** Deletes all items */
  readonly clear: () => void;

  /** Deletes the items in the specified range.  If end is `undefined`, it defaults to `start + 1` */
  readonly delete: (start: number, end?: number) => void;

  /** Return an iterator over the indexes and values, optionally over a specified range and order */
  readonly entries: (range?: number | [number | undefined, number | undefined], reverse?: boolean) => IterableIterator<[number, ValueT]>;

  /** Finds the index of the first matching entry, optionally in a specified range and order */
  readonly findIndex: (
    predicate: (value: ValueT, index: number) => boolean,
    range?: number | [number | undefined, number | undefined],
    reverse?: boolean
  ) => number;

  /** Gets the item at the specified index */
  readonly get: (index: number) => ValueT | undefined;

  /** Gets the number of items in the array */
  readonly getLength: () => number;

  /** Inserts a new set of values at the specified index */
  readonly insert: (index: number, newContent: ValueT[]) => void;

  /** Gets a slice of the array */
  readonly slice: (start: number, end?: number) => ValueT[];

  /** Removes from index to index + length and then inserts newContent at index */
  readonly splice: (index: number, length: number, newContent: ValueT[]) => void;

  /** Return an iterator over the values, optionally over a specified range and order */
  readonly values: (range?: number | [number | undefined, number | undefined], reverse?: boolean) => IterableIterator<ValueT>;
}
