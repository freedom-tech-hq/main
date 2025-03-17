import type { ConflictFreeDocumentField } from './ConflictFreeDocumentField.ts';

export interface ConflictFreeNumericField extends ConflictFreeDocumentField<ConflictFreeNumericField> {
  readonly get: () => number;
  readonly set: (value: number) => void;
}
