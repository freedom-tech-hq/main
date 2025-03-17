import type * as Y from 'yjs';

import type { ConflictFreeNumericField } from '../../types/ConflictFreeNumericField.ts';
import { fieldInfosFieldName } from '../consts/fields.ts';
import type { ConflictFreeDocumentFieldInfos } from '../types/ConflictFreeDocumentFieldInfos.ts';
import { makeChangeListenerSupportForConflictFreeDocumentField } from './makeChangeListenerSupportForConflictFreeDocumentField.ts';

export const makeConflictFreeNumericFieldFromYText = (
  yDoc: Y.Doc,
  fieldInfos: ConflictFreeDocumentFieldInfos,
  fieldName: string
): ConflictFreeNumericField => {
  function getNativeField({ create }: { create: false }): Y.Text | undefined;
  function getNativeField({ create }: { create: true }): Y.Text;
  function getNativeField({ create }: { create: boolean }): Y.Text | undefined {
    if (!fieldInfos.numeric.has(fieldName)) {
      /* node:coverage disable */
      if (!create) {
        return undefined;
      }
      /* node:coverage enable */

      fieldInfos.numeric.add(fieldName);
      yDoc.getMap(fieldInfosFieldName).set(`numeric:${fieldName}`, true);
    }

    return yDoc.getText(fieldName);
  }

  const field: ConflictFreeNumericField = {
    ...makeChangeListenerSupportForConflictFreeDocumentField({
      fieldName,
      getField: () => field,
      getNativeField: () => getNativeField({ create: true })
    }),

    get: () => {
      const yText = getNativeField({ create: false });
      /* node:coverage disable */
      if (yText === undefined) {
        return 0;
      }
      /* node:coverage enable */

      const numberValue = Number(yText.toJSON());
      /* node:coverage disable */
      if (isNaN(numberValue)) {
        return 0;
      }
      /* node:coverage enable */

      return numberValue;
    },

    set: (value) => {
      const yText = getNativeField({ create: true });

      yText.delete(0, yText.length);
      yText.insert(0, String(value));
    }
  };

  return field;
};
