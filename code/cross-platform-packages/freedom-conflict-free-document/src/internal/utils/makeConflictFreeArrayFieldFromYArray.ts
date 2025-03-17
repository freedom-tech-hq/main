import isPromise from 'is-promise';
import type { JsonValue, Schema } from 'yaschema';
import type * as Y from 'yjs';

import type { ConflictFreeArrayField } from '../../types/ConflictFreeArrayField.ts';
import { fieldInfosFieldName } from '../consts/fields.ts';
import type { ConflictFreeDocumentFieldInfos } from '../types/ConflictFreeDocumentFieldInfos.ts';
import { makeChangeListenerSupportForConflictFreeDocumentField } from './makeChangeListenerSupportForConflictFreeDocumentField.ts';

export const makeConflictFreeArrayFieldFromYArray = <ValueT>(
  yDoc: Y.Doc,
  fieldInfos: ConflictFreeDocumentFieldInfos,
  fieldName: string,
  schema: Schema<ValueT>
): ConflictFreeArrayField<ValueT> => {
  function getNativeField({ create }: { create: false }): Y.Array<string> | undefined;
  function getNativeField({ create }: { create: true }): Y.Array<string>;
  function getNativeField({ create }: { create: boolean }): Y.Array<string> | undefined {
    if (!fieldInfos.array.has(fieldName)) {
      if (!create) {
        return undefined;
      }

      fieldInfos.array.add(fieldName);
      yDoc.getMap(fieldInfosFieldName).set(`array:${fieldName}`, true);
    }

    return yDoc.getArray<string>(fieldName);
  }

  const field: ConflictFreeArrayField<ValueT> = {
    ...makeChangeListenerSupportForConflictFreeDocumentField({
      fieldName,
      getField: () => field,
      getNativeField: () => getNativeField({ create: true })
    }),

    append: (newContent) => {
      field.insert(field.getLength(), newContent);
    },

    clear: () => {
      const yArray = getNativeField({ create: false });
      /* node:coverage disable */
      if (yArray === undefined) {
        return; // Nothing to do
      }
      /* node:coverage enable */

      yArray.delete(0, yArray.length);
    },

    delete: (start, end) => {
      const yArray = getNativeField({ create: false });
      /* node:coverage disable */
      if (yArray === undefined) {
        return; // Nothing to do
      }
      /* node:coverage enable */

      /* node:coverage disable */
      if (end === undefined) {
        end = start + 1;
      }
      /* node:coverage enable */

      /* node:coverage disable */
      if (end <= start) {
        return; // Not sensible, so do nothing
      }
      /* node:coverage enable */

      yArray.delete(start, end - start);
    },

    entries: (range, reverse = false): IterableIterator<[number, ValueT]> => {
      const yArray = getNativeField({ create: false });
      /* node:coverage disable */
      if (yArray === undefined) {
        const emptyIterator: IterableIterator<[number, ValueT]> = {
          [Symbol.iterator]: () => emptyIterator,
          next: () => ({ done: true, value: undefined })
        };

        return emptyIterator;
      }
      /* node:coverage enable */

      const start = typeof range === 'number' ? range : (range?.[0] ?? 0);
      const end = typeof range === 'number' ? yArray.length : (range?.[1] ?? yArray.length);

      let cursor = reverse ? end - 1 : start;
      const step = reverse ? -1 : 1;

      const iterator: IterableIterator<[number, ValueT]> = {
        [Symbol.iterator]: () => iterator,
        next: () => {
          if (cursor < Math.max(0, start) || cursor >= Math.min(yArray.length, end)) {
            return { done: true, value: undefined };
          }

          const value: [number, ValueT] = [cursor, field.get(cursor)!];
          cursor += step;

          return { done: false, value };
        }
      };

      return iterator;
    },

    findIndex: (predicate, range, reverse) => {
      for (const [index, value] of field.entries(range, reverse)) {
        if (predicate(value, index)) {
          return index;
        }
      }

      return -1;
    },

    get: (index) => {
      const yArray = getNativeField({ create: false });
      /* node:coverage disable */
      if (yArray === undefined) {
        return undefined;
      }
      /* node:coverage enable */

      const item = yArray.get(index);
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

    insert: (index, newContent) => {
      if (newContent.length === 0) {
        return;
      }

      const encodedNewContent = newContent.map((item) => {
        const serialization = schema.serializeAsync(item, { forceSync: true });
        /* node:coverage disable */
        if (isPromise(serialization)) {
          throw new Error('Serialization must be synchronous');
        } else if (serialization.error !== undefined) {
          throw new Error(`Failed to serialize value: ${serialization.error}`);
        }
        /* node:coverage enable */
        return JSON.stringify(serialization.serialized);
      });

      const yArray = getNativeField({ create: true });
      yArray.insert(index, encodedNewContent);
    },

    getLength: () => {
      const yArray = getNativeField({ create: false });
      return yArray?.length ?? 0;
    },

    slice: (start, end) => {
      const yArray = getNativeField({ create: false });
      /* node:coverage disable */
      if (yArray === undefined) {
        return [];
      }
      /* node:coverage enable */

      /* node:coverage disable */
      if (end === undefined) {
        end = yArray.length;
      }
      /* node:coverage enable */

      /* node:coverage disable */
      if (end < start) {
        return []; // Not sensible, so do nothing
      }
      /* node:coverage enable */

      const out: ValueT[] = [];

      for (let index = Math.max(0, start); index < Math.min(yArray.length, end); index += 1) {
        out.push(field.get(index)!);
      }

      return out;
    },

    splice: (index, length, newContent) => {
      field.delete(index, index + length);
      field.insert(index, newContent);
    },

    values: (range, reverse = false): IterableIterator<ValueT> => {
      const yArray = getNativeField({ create: false });
      /* node:coverage disable */
      if (yArray === undefined) {
        const emptyIterator: IterableIterator<ValueT> = {
          [Symbol.iterator]: () => emptyIterator,
          next: () => ({ done: true, value: undefined })
        };

        return emptyIterator;
      }
      /* node:coverage enable */

      const start = typeof range === 'number' ? range : (range?.[0] ?? 0);
      const end = typeof range === 'number' ? yArray.length : (range?.[1] ?? yArray.length);

      let cursor = reverse ? end - 1 : start;
      const step = reverse ? -1 : 1;

      const iterator: IterableIterator<ValueT> = {
        [Symbol.iterator]: () => iterator,
        next: () => {
          if (cursor < Math.max(0, start) || cursor >= Math.min(yArray.length, end)) {
            return { done: true, value: undefined };
          }

          const value: ValueT = field.get(cursor)!;
          cursor += step;

          return { done: false, value };
        }
      };

      return iterator;
    }
  };

  return field;
};
