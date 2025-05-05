import { isEqual } from 'lodash-es';
import type { JsonValue, Schema } from 'yaschema';
import type * as Y from 'yjs';

import type { ConflictFreeAsyncMapField } from '../../types/ConflictFreeAsyncMapField.ts';
import { fieldInfosFieldName } from '../consts/fields.ts';
import type { ConflictFreeDocumentFieldInfos } from '../types/ConflictFreeDocumentFieldInfos.ts';
import { makeChangeListenerSupportForConflictFreeDocumentField } from './makeChangeListenerSupportForConflictFreeDocumentField.ts';

export const makeConflictFreeAsyncMapFieldFromYMap = <KeyT extends string, ValueT>(
  yDoc: Y.Doc,
  fieldInfos: ConflictFreeDocumentFieldInfos,
  fieldName: string,
  schema: Schema<ValueT>
): ConflictFreeAsyncMapField<KeyT, ValueT> => {
  function getNativeField({ create }: { create: false }): Y.Map<string> | undefined;
  function getNativeField({ create }: { create: true }): Y.Map<string>;
  function getNativeField({ create }: { create: boolean }): Y.Map<string> | undefined {
    if (!fieldInfos.map.has(fieldName)) {
      if (!create) {
        return undefined;
      }

      fieldInfos.map.add(fieldName);
      yDoc.getMap(fieldInfosFieldName).set(`map:${fieldName}`, true);
    }

    return yDoc.getMap<string>(fieldName);
  }

  const field: ConflictFreeAsyncMapField<KeyT, ValueT> = {
    ...makeChangeListenerSupportForConflictFreeDocumentField({
      fieldName,
      getField: () => field,
      getNativeField: () => getNativeField({ create: true })
    }),

    clear: () => {
      const yMap = getNativeField({ create: false });
      /* node:coverage disable */
      if (yMap === undefined) {
        return; // Nothing to do
      }
      /* node:coverage enable */

      yMap.clear();
    },

    delete: (key) => {
      const yMap = getNativeField({ create: false });
      /* node:coverage disable */
      if (yMap === undefined) {
        return; // Nothing to do
      }
      /* node:coverage enable */

      if (yMap.has(key)) {
        yMap.delete(key);
      }
    },

    entries: (range, reverse = false): IterableIterator<[KeyT, Promise<ValueT>]> => {
      const yMap = getNativeField({ create: false });
      /* node:coverage disable */
      if (yMap === undefined) {
        const emptyIterator: IterableIterator<[KeyT, Promise<ValueT>]> = {
          [Symbol.iterator]: () => emptyIterator,
          next: () => ({ done: true, value: undefined })
        };

        return emptyIterator;
      }
      /* node:coverage enable */

      const allKeys = Array.from(yMap.keys()) as KeyT[];

      const startKey = range?.[0] ?? allKeys[0];
      const endKey = range?.[1] ?? allKeys[allKeys.length - 1];

      const start = allKeys.indexOf(startKey);
      const end = allKeys.indexOf(endKey) + 1;

      let cursor = reverse ? end - 1 : start;
      const step = reverse ? -1 : 1;

      const iterator: IterableIterator<[KeyT, Promise<ValueT>]> = {
        [Symbol.iterator]: () => iterator,
        next: () => {
          if (cursor < Math.max(0, start) || cursor >= Math.min(allKeys.length, end)) {
            return { done: true, value: undefined };
          }

          const cursorKey = allKeys[cursor];
          const value: [KeyT, Promise<ValueT>] = [cursorKey, field.get(cursorKey) as Promise<ValueT>];
          cursor += step;

          return { done: false, value };
        }
      };

      return iterator;
    },

    get: async (key) => {
      const yMap = getNativeField({ create: false });
      /* node:coverage disable */
      if (yMap === undefined) {
        return undefined;
      }
      /* node:coverage enable */

      const item = yMap.get(key);
      if (item === undefined) {
        return undefined;
      }

      const parsed = JSON.parse(item) as JsonValue;
      const deserialization = await schema.deserializeAsync(parsed);
      if (deserialization.error !== undefined) {
        throw new Error(`Failed to deserialize value: ${deserialization.error}`);
      }
      return deserialization.deserialized;
    },

    getSize: () => {
      const yMap = getNativeField({ create: false });
      /* node:coverage disable */
      if (yMap === undefined) {
        return 0;
      }
      /* node:coverage enable */

      return yMap.size;
    },

    has: (key) => {
      const yMap = getNativeField({ create: false });
      /* node:coverage disable */
      if (yMap === undefined) {
        return false;
      }
      /* node:coverage enable */

      return yMap.has(key);
    },

    isEmpty: () => {
      const yMap = getNativeField({ create: false });
      /* node:coverage disable */
      if (yMap === undefined) {
        return true;
      }
      /* node:coverage enable */

      return yMap.size === 0;
    },

    keys: (range, reverse = false): IterableIterator<KeyT> => {
      const yMap = getNativeField({ create: false });
      /* node:coverage disable */
      if (yMap === undefined) {
        const emptyIterator: IterableIterator<KeyT> = {
          [Symbol.iterator]: () => emptyIterator,
          next: () => ({ done: true, value: undefined })
        };

        return emptyIterator;
      }
      /* node:coverage enable */

      const allKeys = Array.from(yMap.keys()) as KeyT[];

      const startKey = range?.[0] ?? allKeys[0];
      const endKey = range?.[1] ?? allKeys[allKeys.length - 1];

      const start = allKeys.indexOf(startKey);
      const end = allKeys.indexOf(endKey) + 1;

      let cursor = reverse ? end - 1 : start;
      const step = reverse ? -1 : 1;

      const iterator: IterableIterator<KeyT> = {
        [Symbol.iterator]: () => iterator,
        next: () => {
          if (cursor < Math.max(0, start) || cursor >= Math.min(allKeys.length, end)) {
            return { done: true, value: undefined };
          }

          const value = allKeys[cursor];
          cursor += step;

          return { done: false, value };
        }
      };

      return iterator;
    },

    set: async (key, value) => {
      const yMap = getNativeField({ create: true });
      const currentValue = yMap.get(key);
      if (!isEqual(currentValue, value)) {
        const serialization = await schema.serializeAsync(value);
        if (serialization.error !== undefined) {
          throw new Error(`Failed to serialize value: ${serialization.error}`);
        }

        yMap.set(key, JSON.stringify(serialization.serialized));
      }
    }
  };

  return field;
};
