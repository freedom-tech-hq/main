import type { JsonValue } from 'yaschema';
import * as Y from 'yjs';

import { fieldInfosFieldName } from '../consts/fields.ts';
import type { ConflictFreeDocumentFieldTypeName } from '../types/ConflictFreeDocumentFieldTypeName.ts';
import { conflictFreeDocumentFieldTypeNames } from '../types/ConflictFreeDocumentFieldTypeName.ts';

export const makeFlattenedYDoc = (yDoc: Y.Doc, { fieldInfos }: { fieldInfos: Record<ConflictFreeDocumentFieldTypeName, Set<string>> }) => {
  const outYDoc = new Y.Doc();

  const handleArrayBased = (fieldTypeName: (ConflictFreeDocumentFieldTypeName & 'array') | 'object') => () => {
    for (const fieldName of fieldInfos[fieldTypeName]) {
      const yArray = yDoc.getArray(fieldName);
      const jsonArray = yArray.toJSON();

      const newYArray = outYDoc.getArray(fieldName);
      newYArray.insert(0, jsonArray);
    }
  };

  const handleMapBased = (fieldTypeName: ConflictFreeDocumentFieldTypeName & ('map' | 'set')) => () => {
    for (const fieldName of fieldInfos[fieldTypeName]) {
      const yMap = yDoc.getMap(fieldName);
      const jsonMap = yMap.toJSON();

      const newYMap = outYDoc.getMap(fieldName);
      for (const [key, value] of Object.entries(jsonMap) as Array<[string, JsonValue]>) {
        newYMap.set(key, value);
      }
    }
  };

  const handleTextBased =
    (fieldTypeName: ConflictFreeDocumentFieldTypeName & ('boolean' | 'numeric' | 'restrictedText' | 'text')) => () => {
      for (const fieldName of fieldInfos[fieldTypeName]) {
        const yText = yDoc.getText(fieldName);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const delta = yText.toDelta();

        const newYText = outYDoc.getText(fieldName);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        newYText.applyDelta(delta);
      }
    };

  const handler: Record<ConflictFreeDocumentFieldTypeName, () => void> = {
    array: handleArrayBased('array'),
    object: handleArrayBased('object'),

    map: handleMapBased('map'),
    set: handleMapBased('set'),

    boolean: handleTextBased('boolean'),
    numeric: handleTextBased('numeric'),
    restrictedText: handleTextBased('restrictedText'),
    text: handleTextBased('text')
  };

  for (const fieldTypeName of conflictFreeDocumentFieldTypeNames) {
    handler[fieldTypeName]();
  }

  // Copy over the field infos
  for (const [key, value] of yDoc.getMap(fieldInfosFieldName).entries()) {
    outYDoc.getMap(fieldInfosFieldName).set(key, value);
  }

  return outYDoc;
};
