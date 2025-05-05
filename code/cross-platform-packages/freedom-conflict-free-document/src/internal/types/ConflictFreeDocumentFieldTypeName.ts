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

export const conflictFreeDocumentAsyncFieldTypeNames = makeStringSubtypeArray('array', 'map', 'object');
export type ConflictFreeDocumentAsyncFieldTypeName = (typeof conflictFreeDocumentAsyncFieldTypeNames)[0];
