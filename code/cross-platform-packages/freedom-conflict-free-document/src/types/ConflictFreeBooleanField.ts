import type { ConflictFreeDocumentField } from './ConflictFreeDocumentField.ts';

export interface ConflictFreeBooleanField extends ConflictFreeDocumentField<ConflictFreeBooleanField> {
  readonly get: () => boolean;
  readonly set: (value: boolean) => void;
}
