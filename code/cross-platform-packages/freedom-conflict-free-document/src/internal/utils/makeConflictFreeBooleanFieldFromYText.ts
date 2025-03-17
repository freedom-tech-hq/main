import type * as Y from 'yjs';

import type { ConflictFreeBooleanField } from '../../types/ConflictFreeBooleanField.ts';
import { fieldInfosFieldName } from '../consts/fields.ts';
import type { ConflictFreeDocumentFieldInfos } from '../types/ConflictFreeDocumentFieldInfos.ts';
import { makeChangeListenerSupportForConflictFreeDocumentField } from './makeChangeListenerSupportForConflictFreeDocumentField.ts';

export const makeConflictFreeBooleanFieldFromYText = (
  yDoc: Y.Doc,
  fieldInfos: ConflictFreeDocumentFieldInfos,
  fieldName: string
): ConflictFreeBooleanField => {
  function getNativeField({ create }: { create: false }): Y.Text | undefined;
  function getNativeField({ create }: { create: true }): Y.Text;
  function getNativeField({ create }: { create: boolean }): Y.Text | undefined;
  function getNativeField({ create }: { create: boolean }): Y.Text | undefined {
    if (!fieldInfos.boolean.has(fieldName)) {
      /* node:coverage disable */
      if (!create) {
        return undefined;
      }
      /* node:coverage enable */

      fieldInfos.boolean.add(fieldName);
      yDoc.getMap(fieldInfosFieldName).set(`boolean:${fieldName}`, true);
    }

    return yDoc.getText(fieldName);
  }

  const field: ConflictFreeBooleanField = {
    ...makeChangeListenerSupportForConflictFreeDocumentField({
      fieldName,
      getField: () => field,
      getNativeField: () => getNativeField({ create: true })
    }),

    get: () => {
      const yText = getNativeField({ create: false });
      /* node:coverage disable */
      if (yText === undefined) {
        return false;
      }
      /* node:coverage enable */

      return yText.length > 0;
    },

    set: (value) => {
      const yText = getNativeField({ create: value });
      /* node:coverage disable */
      if (yText === undefined) {
        return; // Already false
      }
      /* node:coverage enable */

      /* node:coverage disable */
      if (yText.length > 0 === value) {
        return; // Already the correct value
      }
      /* node:coverage enable */

      if (value) {
        yText.insert(0, '1');
      } else {
        yText.delete(0, yText.length);
      }
    }
  };

  return field;
};
