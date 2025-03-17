import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';

import type { IndexedEntries } from '../types/IndexedEntries.ts';

export const makeAffixedKeyIndexedEntries = <KeyPrefixT extends string, KeyT extends string, KeySuffixT extends string, IndexedValueT>(
  { prefix, suffix }: { prefix: KeyPrefixT; suffix: KeySuffixT },
  indexedEntriesAccessor: IndexedEntries<`${KeyPrefixT}${KeyT}${KeySuffixT}`, IndexedValueT>
): IndexedEntries<KeyT, IndexedValueT> => ({
  entries: makeAsyncResultFunc([import.meta.filename, 'entries'], async (trace) => {
    const entries = await indexedEntriesAccessor.entries(trace);
    /* node:coverage disable */
    if (!entries.ok) {
      return entries;
    }
    /* node:coverage enable */

    return makeSuccess(
      entries.value.map(
        ([key, value]) => [key.substring(prefix.length, key.length - suffix.length) as KeyT, value] as [KeyT, IndexedValueT]
      )
    );
  }),

  forEach: makeAsyncResultFunc([import.meta.filename, 'forEach'], (trace, callback) =>
    indexedEntriesAccessor.forEach(trace, (trace, key, value) =>
      callback(trace, key.substring(prefix.length, key.length - suffix.length) as KeyT, value)
    )
  ),

  keys: makeAsyncResultFunc([import.meta.filename, 'keys'], async (trace) => {
    const keys = await indexedEntriesAccessor.keys(trace);
    /* node:coverage disable */
    if (!keys.ok) {
      return keys;
    }
    /* node:coverage enable */

    return makeSuccess(keys.value.map((key) => key.substring(prefix.length, key.length - suffix.length) as KeyT));
  }),

  map: makeAsyncResultFunc([import.meta.filename, 'map'], (trace, callback) =>
    indexedEntriesAccessor.map(trace, (trace, key, value) =>
      callback(trace, key.substring(prefix.length, key.length - suffix.length) as KeyT, value)
    )
  )
});
