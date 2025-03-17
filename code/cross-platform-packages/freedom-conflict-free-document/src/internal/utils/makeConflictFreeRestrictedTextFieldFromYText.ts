import type * as Y from 'yjs';

import type { ConflictFreeRestrictedTextField } from '../../types/ConflictFreeRestrictedTextField.ts';
import { fieldInfosFieldName } from '../consts/fields.ts';
import type { ConflictFreeDocumentFieldInfos } from '../types/ConflictFreeDocumentFieldInfos.ts';
import { makeChangeListenerSupportForConflictFreeDocumentField } from './makeChangeListenerSupportForConflictFreeDocumentField.ts';

export const makeConflictFreeRestrictedTextFieldFromYText = <ValueT extends string>(
  yDoc: Y.Doc,
  fieldInfos: ConflictFreeDocumentFieldInfos,
  fieldName: string,
  defaultValue: ValueT
): ConflictFreeRestrictedTextField<ValueT> => {
  function getNativeField({ create }: { create: false }): Y.Text | undefined;
  function getNativeField({ create }: { create: true }): Y.Text;
  function getNativeField({ create }: { create: boolean }): Y.Text | undefined;
  function getNativeField({ create }: { create: boolean }): Y.Text | undefined {
    if (!fieldInfos.restrictedText.has(fieldName)) {
      /* node:coverage disable */
      if (!create) {
        return undefined;
      }
      /* node:coverage enable */

      fieldInfos.restrictedText.add(fieldName);
      yDoc.getMap(fieldInfosFieldName).set(`restrictedText:${fieldName}`, true);
    }

    return yDoc.getText(fieldName);
  }

  const field: ConflictFreeRestrictedTextField<ValueT> = {
    ...makeChangeListenerSupportForConflictFreeDocumentField({
      fieldName,
      getField: () => field,
      getNativeField: () => getNativeField({ create: true })
    }),

    get: () => {
      const yText = getNativeField({ create: false });
      /* node:coverage disable */
      if (yText === undefined) {
        return defaultValue;
      }
      /* node:coverage enable */

      return yText.toJSON() as ValueT;
    },

    set: (value) => {
      const yText = getNativeField({ create: true });
      /* node:coverage disable */
      if (yText === undefined) {
        return; // Already false
      }
      /* node:coverage enable */

      yText.delete(0, yText.length);
      yText.insert(0, value);
    }
  };

  return field;
};
