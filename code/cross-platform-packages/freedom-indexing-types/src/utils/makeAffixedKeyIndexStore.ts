import type { IndexedEntryFilters, IndexedEntryOptions, IndexStore } from '../types/IndexStore.ts';
import { makeAffixedKeyIndexedEntries } from './makeAffixedKeyIndexedEntries.ts';

export const makeAffixedKeyIndexStore = <KeyPrefixT extends string, KeyT extends string, KeySuffixT extends string, IndexedValueT>(
  { prefix, suffix }: { prefix: KeyPrefixT; suffix: KeySuffixT },
  indexStore: IndexStore<`${KeyPrefixT}${KeyT}${KeySuffixT}`, IndexedValueT>
): IndexStore<KeyT, IndexedValueT> => ({
  uid: JSON.stringify({ affixedKeyIndexStoreUid: indexStore.uid, prefix, suffix }),

  count: (trace, { prefix: extraPrefix = '', suffix: extraSuffix = '' }: { prefix?: string; suffix?: string } = {}) =>
    indexStore.count(trace, { prefix: `${prefix}${extraPrefix}`, suffix: `${extraSuffix}${suffix}` }),

  asc: (
    { prefix: extraPrefix = '', suffix: extraSuffix = '', offset, limit }: IndexedEntryOptions = {},
    filters: IndexedEntryFilters<IndexedValueT> = {}
  ) =>
    makeAffixedKeyIndexedEntries<KeyPrefixT, KeyT, KeySuffixT, IndexedValueT>(
      { prefix, suffix },
      indexStore.asc({ prefix: `${prefix}${extraPrefix}`, suffix: `${extraSuffix}${suffix}`, offset, limit }, filters)
    ),

  desc: (
    { prefix: extraPrefix = '', suffix: extraSuffix = '', offset, limit }: IndexedEntryOptions = {},
    filters: IndexedEntryFilters<IndexedValueT> = {}
  ) =>
    makeAffixedKeyIndexedEntries<KeyPrefixT, KeyT, KeySuffixT, IndexedValueT>(
      { prefix, suffix },
      indexStore.desc({ prefix: `${prefix}${extraPrefix}`, suffix: `${extraSuffix}${suffix}`, offset, limit }, filters)
    ),

  keyRange: (
    minKey: KeyT | undefined,
    maxKey: KeyT | undefined,
    {
      prefix: extraPrefix = '',
      suffix: extraSuffix = '',
      inclusiveMin,
      inclusiveMax
    }: { prefix?: string; suffix?: string; inclusiveMin?: boolean; inclusiveMax?: boolean } = {}
  ) =>
    makeAffixedKeyIndexedEntries<KeyPrefixT, KeyT, KeySuffixT, IndexedValueT>(
      { prefix, suffix },
      indexStore.keyRange(
        minKey !== undefined ? `${prefix}${minKey}${suffix}` : undefined,
        maxKey !== undefined ? `${prefix}${maxKey}${suffix}` : undefined,
        { prefix: `${prefix}${extraPrefix}`, suffix: `${extraSuffix}${suffix}`, inclusiveMin, inclusiveMax }
      )
    )
});
