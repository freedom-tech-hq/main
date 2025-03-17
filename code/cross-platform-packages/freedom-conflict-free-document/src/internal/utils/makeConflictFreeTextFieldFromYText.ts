import type { JsonObject } from 'yaschema';
import type * as Y from 'yjs';

import type { ConflictFreeTextField } from '../../types/ConflictFreeTextField.ts';
import type { ConflictFreeTextFragment } from '../../types/ConflictFreeTextFragment.ts';
import { fieldInfosFieldName } from '../consts/fields.ts';
import type { ConflictFreeDocumentFieldInfos } from '../types/ConflictFreeDocumentFieldInfos.ts';
import { makeChangeListenerSupportForConflictFreeDocumentField } from './makeChangeListenerSupportForConflictFreeDocumentField.ts';

export const makeConflictFreeTextFieldFromYText = <AttribT extends JsonObject = JsonObject>(
  yDoc: Y.Doc,
  fieldInfos: ConflictFreeDocumentFieldInfos,
  fieldName: string
): ConflictFreeTextField<AttribT> => {
  function getNativeField({ create }: { create: false }): Y.Text | undefined;
  function getNativeField({ create }: { create: true }): Y.Text;
  function getNativeField({ create }: { create: boolean }): Y.Text | undefined {
    if (!fieldInfos.text.has(fieldName)) {
      if (!create) {
        return undefined;
      }

      fieldInfos.text.add(fieldName);
      yDoc.getMap(fieldInfosFieldName).set(`text:${fieldName}`, true);
    }

    return yDoc.getText(fieldName);
  }

  const field: ConflictFreeTextField<AttribT> = {
    ...makeChangeListenerSupportForConflictFreeDocumentField({
      fieldName,
      getField: () => field,
      getNativeField: () => getNativeField({ create: true })
    }),

    clear: () => {
      const yText = getNativeField({ create: false });
      /* node:coverage disable */
      if (yText === undefined) {
        return; // Nothing to do
      }
      /* node:coverage enable */

      yText.delete(0, yText.length);
    },

    delete: (start, end) => {
      const yText = getNativeField({ create: false });
      /* node:coverage disable */
      if (yText === undefined) {
        return; // Nothing to do
      }
      /* node:coverage enable */

      /* node:coverage disable */
      if (end === undefined) {
        end = yText.length;
      }
      /* node:coverage enable */

      /* node:coverage disable */
      if (end <= start) {
        return; // Not sensible, so do nothing
      }
      /* node:coverage enable */

      yText.delete(start, end - start);
    },

    getLength: () => {
      const yText = getNativeField({ create: false });
      return yText?.length ?? 0;
    },

    getString: (start, end) => {
      const yText = getNativeField({ create: false });
      /* node:coverage disable */
      if (yText === undefined) {
        return '';
      }
      /* node:coverage enable */

      const completeText = yText.toJSON();
      return start === undefined ? completeText : completeText.substring(start, end);
    },

    getTextFragments: () => {
      const yText = getNativeField({ create: false });
      /* node:coverage disable */
      if (yText === undefined) {
        return []; // Nothing to do
      }
      /* node:coverage enable */

      const out: ConflictFreeTextFragment<AttribT>[] = [];
      for (const part of yText.toDelta() as Array<{ insert?: string; attributes?: AttribT }>) {
        if (part.insert !== undefined) {
          out.push({ text: part.insert, attributes: part.attributes });
        }
      }
      return out;
    },

    replace: (positionOrRange, value, attributes) => {
      const yText = getNativeField({ create: true });

      const start = typeof positionOrRange === 'number' ? positionOrRange : positionOrRange[0];
      const end = typeof positionOrRange === 'number' ? positionOrRange : (positionOrRange[1] ?? yText.length);

      /* node:coverage disable */
      if (end < start) {
        return; // Not sensible, so do nothing
      }
      /* node:coverage enable */

      if (value === undefined) {
        // If no value is supplied, keep the existing value for the specified range and replace the attributes.  If no attributes are
        // provided, there's nothing to do
        if (attributes !== undefined) {
          yText.format(start, end - start, attributes);
        }
      } else {
        if (end > start) {
          yText.delete(start, end - start);
        }
        if (value.length > 0) {
          yText.insert(start, value, attributes);
        }
      }
    }
  };

  return field;
};
