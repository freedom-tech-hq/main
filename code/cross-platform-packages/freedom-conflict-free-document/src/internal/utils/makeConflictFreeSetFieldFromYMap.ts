import type * as Y from 'yjs';

import type { ConflictFreeSetField } from '../../types/ConflictFreeSetField.ts';
import { fieldInfosFieldName } from '../consts/fields.ts';
import type { ConflictFreeDocumentFieldInfos } from '../types/ConflictFreeDocumentFieldInfos.ts';
import { makeChangeListenerSupportForConflictFreeDocumentField } from './makeChangeListenerSupportForConflictFreeDocumentField.ts';

export const makeConflictFreeSetFieldFromYMap = <ValueT extends string = string>(
  yDoc: Y.Doc,
  fieldInfos: ConflictFreeDocumentFieldInfos,
  fieldName: string
): ConflictFreeSetField<ValueT> => {
  function getNativeField({ create }: { create: false }): Y.Map<true> | undefined;
  function getNativeField({ create }: { create: true }): Y.Map<true>;
  function getNativeField({ create }: { create: boolean }): Y.Map<true> | undefined {
    if (!fieldInfos.set.has(fieldName)) {
      if (!create) {
        return undefined;
      }

      fieldInfos.set.add(fieldName);
      yDoc.getMap(fieldInfosFieldName).set(`set:${fieldName}`, true);
    }

    return yDoc.getMap<true>(fieldName);
  }

  const field: ConflictFreeSetField<ValueT> = {
    ...makeChangeListenerSupportForConflictFreeDocumentField({
      fieldName,
      getField: () => field,
      getNativeField: () => getNativeField({ create: true })
    }),

    add: (...values) => {
      const yMap = getNativeField({ create: true });
      for (const value of values) {
        if (!yMap.has(value)) {
          yMap.set(value, true);
        }
      }
    },

    clear: () => {
      const yMap = getNativeField({ create: false });
      /* node:coverage disable */
      if (yMap === undefined) {
        return; // Nothing to do
      }
      /* node:coverage enable */

      yMap.clear();
    },

    delete: (...values) => {
      const yMap = getNativeField({ create: false });
      /* node:coverage disable */
      if (yMap === undefined) {
        return; // Nothing to do
      }
      /* node:coverage enable */

      for (const value of values) {
        if (yMap.has(value)) {
          yMap.delete(value);
        }
      }
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

    has: (value) => {
      const yMap = getNativeField({ create: false });
      /* node:coverage disable */
      if (yMap === undefined) {
        return false;
      }
      /* node:coverage enable */

      return yMap.has(value);
    },

    iterator: (): IterableIterator<ValueT> => {
      const yMap = getNativeField({ create: false });
      /* node:coverage disable */
      if (yMap === undefined) {
        const emptyIterator: IterableIterator<ValueT> = {
          [Symbol.iterator]: () => emptyIterator,
          next: () => ({ done: true, value: undefined })
        };

        return emptyIterator;
      }
      /* node:coverage enable */

      const allKeys = Array.from(yMap.keys()) as ValueT[];

      const start = 0;
      const end = allKeys.length;

      let cursor = start;

      const iterator: IterableIterator<ValueT> = {
        [Symbol.iterator]: () => iterator,
        next: () => {
          if (cursor < Math.max(0, start) || cursor >= Math.min(allKeys.length, end)) {
            return { done: true, value: undefined };
          }

          const value = allKeys[cursor];
          cursor += 1;

          return { done: false, value };
        }
      };

      return iterator;
    }
  };

  return field;
};
