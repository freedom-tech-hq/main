import type { ConflictFreeDocumentFieldInfos } from '../types/ConflictFreeDocumentFieldInfos.ts';
import { conflictFreeDocumentFieldTypeNames } from '../types/ConflictFreeDocumentFieldTypeName.ts';
import { makeConflictFreeDocumentFieldInfos } from './makeConflictFreeDocumentFieldInfos.ts';

export const mergeFieldInfos = (...fieldInfos: ConflictFreeDocumentFieldInfos[]): ConflictFreeDocumentFieldInfos => {
  const output = makeConflictFreeDocumentFieldInfos();

  for (const fieldInfo of fieldInfos) {
    for (const typeName of conflictFreeDocumentFieldTypeNames) {
      for (const fieldName of fieldInfo[typeName]) {
        output[typeName].add(fieldName);
      }
    }
  }

  return output;
};
