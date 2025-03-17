import isPromise from 'is-promise';
import type { JsonValue, Schema } from 'yaschema';
import type * as Y from 'yjs';

import type { ConflictFreeObjectField } from '../../types/ConflictFreeObjectField.ts';
import { fieldInfosFieldName } from '../consts/fields.ts';
import type { ConflictFreeDocumentFieldInfos } from '../types/ConflictFreeDocumentFieldInfos.ts';
import { makeChangeListenerSupportForConflictFreeDocumentField } from './makeChangeListenerSupportForConflictFreeDocumentField.ts';

export const makeConflictFreeObjectFieldFromYArray = <ValueT>(
  yDoc: Y.Doc,
  fieldInfos: ConflictFreeDocumentFieldInfos,
  fieldName: string,
  schema: Schema<ValueT>
): ConflictFreeObjectField<ValueT> => {
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

  const field: ConflictFreeObjectField<ValueT> = {
    ...makeChangeListenerSupportForConflictFreeDocumentField({
      fieldName,
      getField: () => field,
      getNativeField: () => getNativeField({ create: true })
    }),

    get: () => {
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
      const deserialization = schema.deserializeAsync(parsed, { forceSync: true });
      /* node:coverage disable */
      if (isPromise(deserialization)) {
        throw new Error('Deserialization must be synchronous');
      } else if (deserialization.error !== undefined) {
        throw new Error(`Failed to deserialize value: ${deserialization.error}`);
      }
      /* node:coverage enable */
      return deserialization.deserialized;
    },

    set: (newValue) => {
      if (newValue === undefined) {
        const yArray = getNativeField({ create: false });

        if (yArray !== undefined && yArray.length > 0) {
          yArray.delete(0);
        }
      } else {
        const serialization = schema.serializeAsync(newValue, { forceSync: true });
        /* node:coverage disable */
        if (isPromise(serialization)) {
          throw new Error('Serialization must be synchronous');
        } else if (serialization.error !== undefined) {
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
