import type { PR } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

import type { IndexedEntries } from './IndexedEntries.ts';

export type InferIndexStoreKeyType<T> = T extends IndexStore<infer KeyT, any> ? KeyT : never;

export type InferIndexStoreValueType<T> = T extends IndexStore<any, infer ValueT> ? ValueT : never;

export interface IndexedEntryOptions {
  prefix?: string;
  suffix?: string;
  offset?: number;
  limit?: number;
}

export interface IndexedEntryFilters<IndexedValueT> {
  lt?: IndexedValueT;
  lte?: IndexedValueT;
  gt?: IndexedValueT;
  gte?: IndexedValueT;
}

export interface IndexStore<KeyT extends string, IndexedValueT> {
  uid: string;

  /** Returns the number of entries, optionally filtered by prefix */
  count: (
    trace: Trace,
    options?: Omit<IndexedEntryOptions, 'offset' | 'limit'>,
    filters?: IndexedEntryFilters<IndexedValueT>
  ) => PR<number>;

  /** Ascending order.  `offset` and `limit` may take precedence over `prefix`, so when `prefix` is specified and non-empty, there may be
   * cases where fewer than the `limit` number of results are returned, but there may be additional results beyond `offset + limit`
   * anyway. */
  asc: (options?: IndexedEntryOptions, filters?: IndexedEntryFilters<IndexedValueT>) => IndexedEntries<KeyT, IndexedValueT>;

  /** Descending order.  `offset` and `limit` may take precedence over `prefix`, so when `prefix` is specified and non-empty, there may be
   * cases where fewer than the `limit` number of results are returned, but there may be additional results beyond `offset + limit`
   * anyway. */
  desc: (options?: IndexedEntryOptions, filters?: IndexedEntryFilters<IndexedValueT>) => IndexedEntries<KeyT, IndexedValueT>;
}
