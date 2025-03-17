import type { ConflictFreeDocumentField } from './ConflictFreeDocumentField.ts';

export type ConflictFreeDocumentFieldNotification<FieldT extends ConflictFreeDocumentField<FieldT>> = {
  change: { fieldName: string; field: FieldT };
};
