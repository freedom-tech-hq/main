import type { ConflictFreeDocumentField } from './ConflictFreeDocumentField.ts';

export interface ConflictFreeAsyncObjectField<ValueT> extends ConflictFreeDocumentField<ConflictFreeAsyncObjectField<ValueT>> {
  /** Gets the value */
  readonly get: () => Promise<ValueT | undefined>;

  /** Sets the value */
  readonly set: (value: ValueT | undefined) => Promise<void>;
}
