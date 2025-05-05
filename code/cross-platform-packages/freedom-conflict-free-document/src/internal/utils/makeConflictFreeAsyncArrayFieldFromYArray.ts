import { type JsonValue, type Schema } from 'yaschema';
import type * as Y from 'yjs';

import type { ConflictFreeAsyncArrayField } from '../../types/ConflictFreeAsyncArrayField.ts';
import { fieldInfosFieldName } from '../consts/fields.ts';
import type { ConflictFreeDocumentFieldInfos } from '../types/ConflictFreeDocumentFieldInfos.ts';
import { makeChangeListenerSupportForConflictFreeDocumentField } from './makeChangeListenerSupportForConflictFreeDocumentField.ts';

export const makeConflictFreeAsyncArrayFieldFromYArray = <ValueT>(
  yDoc: Y.Doc,
  fieldInfos: ConflictFreeDocumentFieldInfos,
  fieldName: string,
  schema: Schema<ValueT>
): ConflictFreeAsyncArrayField<ValueT> => {
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

  const field: ConflictFreeAsyncArrayField<ValueT> = {
    ...makeChangeListenerSupportForConflictFreeDocumentField({
      fieldName,
      getField: () => field,
      getNativeField: () => getNativeField({ create: true })
    }),

    append: async (newContent) => {
      await field.insert(field.getLength(), newContent);
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

    entries: (range, reverse = false): IterableIterator<[number, Promise<ValueT>]> => {
      const yArray = getNativeField({ create: false });
      /* node:coverage disable */
      if (yArray === undefined) {
        const emptyIterator: IterableIterator<[number, Promise<ValueT>]> = {
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

      const iterator: IterableIterator<[number, Promise<ValueT>]> = {
        [Symbol.iterator]: () => iterator,
        next: () => {
          if (cursor < Math.max(0, start) || cursor >= Math.min(yArray.length, end)) {
            return { done: true, value: undefined };
          }

          const value: [number, Promise<ValueT>] = [cursor, field.get(cursor) as Promise<ValueT>];
          cursor += step;

          return { done: false, value };
        }
      };

      return iterator;
    },

    findIndex: async (predicate, range, reverse) => {
      for (const [index, value] of field.entries(range, reverse)) {
        if (predicate(await value, index)) {
          return index;
        }
      }

      return -1;
    },

    get: async (index) => {
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
      const deserialization = await schema.deserializeAsync(parsed);
      /* node:coverage disable */
      if (deserialization.error !== undefined) {
        throw new Error(`Failed to deserialize value: ${deserialization.error}`);
      }
      /* node:coverage enable */
      return deserialization.deserialized;
    },

    insert: async (index, newContent) => {
      if (newContent.length === 0) {
        return;
      }

      const encodedNewContent: string[] = [];
      for (const item of newContent) {
        const serialization = await schema.serializeAsync(item);
        /* node:coverage disable */
        if (serialization.error !== undefined) {
          throw new Error(`Failed to serialize value: ${serialization.error}`);
        }
        /* node:coverage enable */

        encodedNewContent.push(JSON.stringify(serialization.serialized));
      }

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

      const out: Array<Promise<ValueT>> = [];

      for (let index = Math.max(0, start); index < Math.min(yArray.length, end); index += 1) {
        out.push(field.get(index) as Promise<ValueT>);
      }

      return out;
    },

    splice: async (index, length, newContent) => {
      field.delete(index, index + length);
      await field.insert(index, newContent);
    },

    values: (range, reverse = false): IterableIterator<Promise<ValueT>> => {
      const yArray = getNativeField({ create: false });
      /* node:coverage disable */
      if (yArray === undefined) {
        const emptyIterator: IterableIterator<Promise<ValueT>> = {
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

      const iterator: IterableIterator<Promise<ValueT>> = {
        [Symbol.iterator]: () => iterator,
        next: () => {
          if (cursor < Math.max(0, start) || cursor >= Math.min(yArray.length, end)) {
            return { done: true, value: undefined };
          }

          const value: Promise<ValueT> = field.get(cursor) as Promise<ValueT>;
          cursor += step;

          return { done: false, value };
        }
      };

      return iterator;
    }
  };

  return field;
};
