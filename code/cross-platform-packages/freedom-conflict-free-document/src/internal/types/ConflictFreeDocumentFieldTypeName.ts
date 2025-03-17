import { makeStringSubtypeArray } from 'yaschema';

export const conflictFreeDocumentFieldTypeNames = makeStringSubtypeArray(
  'array',
  'boolean',
  'map',
  'numeric',
  'object',
  'restrictedText',
  'set',
  'text'
);
export type ConflictFreeDocumentFieldTypeName = (typeof conflictFreeDocumentFieldTypeNames)[0];
