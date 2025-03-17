import type { ConflictFreeDocumentField } from './ConflictFreeDocumentField.ts';

export interface ConflictFreeObjectField<ValueT> extends ConflictFreeDocumentField<ConflictFreeObjectField<ValueT>> {
  /** Gets the value */
  readonly get: () => ValueT | undefined;

  /** Sets the value */
  readonly set: (value: ValueT | undefined) => void;
}
