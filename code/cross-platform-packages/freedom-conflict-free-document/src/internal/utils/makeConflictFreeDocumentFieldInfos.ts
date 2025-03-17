import type { ConflictFreeDocumentFieldInfos } from '../types/ConflictFreeDocumentFieldInfos.ts';

export const makeConflictFreeDocumentFieldInfos = (): ConflictFreeDocumentFieldInfos => ({
  array: new Set<string>(),
  boolean: new Set<string>(),
  map: new Set<string>(),
  numeric: new Set<string>(),
  object: new Set<string>(),
  restrictedText: new Set<string>(),
  set: new Set<string>(),
  text: new Set<string>()
});
