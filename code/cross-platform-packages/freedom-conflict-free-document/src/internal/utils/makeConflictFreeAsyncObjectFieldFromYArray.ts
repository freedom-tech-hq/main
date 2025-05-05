import type { JsonValue, Schema } from 'yaschema';
import type * as Y from 'yjs';

import type { ConflictFreeAsyncObjectField } from '../../types/ConflictFreeAsyncObjectField.ts';
import { fieldInfosFieldName } from '../consts/fields.ts';
import type { ConflictFreeDocumentFieldInfos } from '../types/ConflictFreeDocumentFieldInfos.ts';
import { makeChangeListenerSupportForConflictFreeDocumentField } from './makeChangeListenerSupportForConflictFreeDocumentField.ts';

export const makeConflictFreeAsyncObjectFieldFromYArray = <ValueT>(
  yDoc: Y.Doc,
  fieldInfos: ConflictFreeDocumentFieldInfos,
  fieldName: string,
  schema: Schema<ValueT>
): ConflictFreeAsyncObjectField<ValueT> => {
  function getNativeField({ create }: { create: false }): Y.Array<string> | undefined;
  function getNativeField({ create }: { create: true }): Y.Array<string>;
  function getNativeField({ create }: { create: boolean }): Y.Array<string> | undefined {
    if (!fieldInfos.object.has(fieldName)) {
      if (!create) {
        return undefined;
      }

      fieldInfos.object.add(fieldName);
      yDoc.getMap(fieldInfosFieldName).set(`object:${fieldName}`, true);
    }

    return yDoc.getArray<string>(fieldName);
  }

  const field: ConflictFreeAsyncObjectField<ValueT> = {
    ...makeChangeListenerSupportForConflictFreeDocumentField({
      fieldName,
      getField: () => field,
      getNativeField: () => getNativeField({ create: true })
    }),

    get: async () => {
      const yArray = getNativeField({ create: false });
      /* node:coverage disable */
      if (yArray === undefined) {
        return undefined;
      }
      /* node:coverage enable */

      const item = yArray.get(0);
      if (item === undefined) {
        return undefined;
      }

      const parsed = JSON.parse(item) as JsonValue;
      const deserialization = await schema.deserializeAsync(parsed);
      /* node:coverage disable */
      if (deserialization.error !== undefined) {
        throw new Error(`Failed to deserialize value: ${deserialization.error}`);
      }
      /* node:coverage enable */
      return deserialization.deserialized;
    },

    set: async (newValue) => {
      if (newValue === undefined) {
        const yArray = getNativeField({ create: false });

        if (yArray !== undefined && yArray.length > 0) {
          yArray.delete(0);
        }
      } else {
        const serialization = await schema.serializeAsync(newValue);
        /* node:coverage disable */
        if (serialization.error !== undefined) {
          throw new Error(`Failed to serialize value: ${serialization.error}`);
        }
        /* node:coverage enable */
        const encodedNewValue = JSON.stringify(serialization.serialized);

        const yArray = getNativeField({ create: true });

        if (yArray.length > 0) {
          yArray.delete(0);
        }
        yArray.insert(0, [encodedNewValue]);
      }
    }
  };

  return field;
};
