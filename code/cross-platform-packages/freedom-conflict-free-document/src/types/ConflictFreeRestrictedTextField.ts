import type { ConflictFreeDocumentField } from './ConflictFreeDocumentField.ts';

export interface ConflictFreeRestrictedTextField<ValueT extends string>
  extends ConflictFreeDocumentField<ConflictFreeRestrictedTextField<ValueT>> {
  readonly get: () => ValueT;
  readonly set: (value: ValueT) => void;
}
