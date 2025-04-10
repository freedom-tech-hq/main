import { Tree as AvlTree } from 'avl';
import type { PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, withResolved } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import type { TypeOrPromisedType } from 'yaschema';

import type { IndexedEntries } from './IndexedEntries.ts';
import type { IndexedEntryFilters, IndexedEntryOptions } from './IndexStore.ts';
import type { IndexConfig } from './IndexType.ts';
import type { MutableIndexStore } from './MutableIndexStore.ts';

export type EntryComparator<KeyT extends string, IndexedValueT> = (a: [KeyT, IndexedValueT], b: [KeyT, IndexedValueT]) => number;
export type EntryTransformer<ValueT, IndexedValueT> = (value: ValueT) => IndexedValueT;

export class InMemoryIndexStore<KeyT extends string, IndexedValueT> implements MutableIndexStore<KeyT, IndexedValueT> {
  public readonly uid = makeUuid();

  private readonly entryComparator_: EntryComparator<KeyT, IndexedValueT>;
  private readonly index_: AvlTree<[KeyT, IndexedValueT], undefined>;
  private readonly indexEntriesByKey_ = new Map<KeyT, [KeyT, IndexedValueT]>();

  constructor({ config }: { _keyType?: KeyT; _valueType?: IndexedValueT; config: IndexConfig<IndexedValueT> }) {
    this.entryComparator_ = makeEntryComparatorForConfig<KeyT, IndexedValueT>(config);
    this.index_ = new AvlTree<[KeyT, IndexedValueT], undefined>(this.entryComparator_, true);
  }

  // IndexStore Methods

  public readonly count = makeAsyncResultFunc(
    [import.meta.filename, 'count'],
    async (
      _trace,
      { prefix = '', suffix = '' }: Omit<IndexedEntryOptions, 'offset' | 'limit'> = {},
      filters: IndexedEntryFilters<IndexedValueT> = {}
    ): PR<number> => {
      if (prefix === '' && suffix === '') {
        return makeSuccess(this.index_.size);
      }

      return makeSuccess(
        Array.from(this.indexEntriesByKey_.values()).filter(
          ([key, value]) =>
            key.startsWith(prefix) && key.endsWith(suffix) && isValueIncludedByFilters(key, value, filters, this.entryComparator_)
        ).length
      );
    }
  );

  public asc({ prefix, suffix, offset, limit }: IndexedEntryOptions = {}): IndexedEntries<KeyT, IndexedValueT> {
    return this.makeIndexedEntriesForOrder_({ prefix: prefix ?? '', suffix: suffix ?? '', offset: offset ?? 0, limit, step: 1 });
  }

  public desc({ prefix, suffix, offset, limit }: IndexedEntryOptions = {}): IndexedEntries<KeyT, IndexedValueT> {
    return this.makeIndexedEntriesForOrder_({
      prefix: prefix ?? '',
      suffix: suffix ?? '',
      offset: this.index_.size - 1 - (offset ?? 0),
      limit,
      step: -1
    });
  }

  // MutableIndexStore Methods

  public readonly addToIndex = makeAsyncResultFunc(
    [import.meta.filename, 'addToIndex'],
    async (_trace, key: KeyT, value: IndexedValueT): PR<undefined> => {
      // Removing the old entry if it exists
      const oldEntry = this.indexEntriesByKey_.get(key);
      if (oldEntry !== undefined) {
        this.index_.remove(oldEntry);
        this.indexEntriesByKey_.delete(key);
      }

      const newEntry: [KeyT, IndexedValueT] = [key, value];
      this.index_.insert(newEntry, undefined);
      this.indexEntriesByKey_.set(key, newEntry);

      return makeSuccess(undefined);
    }
  );

  public readonly removeFromIndex = makeAsyncResultFunc(
    [import.meta.filename, 'removeFromIndex'],
    async (_trace, key: KeyT): PR<undefined> => {
      const entry = this.indexEntriesByKey_.get(key);
      /* node:coverage disable */
      if (entry === undefined) {
        return makeSuccess(undefined); // Nothing to do
      }
      /* node:coverage enable */

      this.index_.remove(entry);
      this.indexEntriesByKey_.delete(key);

      return makeSuccess(undefined);
    }
  );

  // Private Methods

  private makeIndexedEntriesForOrder_({
    prefix,
    suffix,
    offset,
    limit,
    step
  }: {
    prefix: string;
    suffix: string;
    offset: number;
    limit?: number;
    step: number;
  }): IndexedEntries<KeyT, IndexedValueT> {
    const forEach = async <ErrorCodeT extends string = never>(
      trace: Trace,
      callback: (trace: Trace, key: KeyT, value: IndexedValueT) => TypeOrPromisedType<Result<undefined, ErrorCodeT> | void>
    ): PR<undefined, ErrorCodeT> => {
      let index = offset;
      while (index >= 0 && index < this.index_.size && (limit === undefined || index < offset + limit)) {
        const node = this.index_.at(index);
        /* node:coverage disable */
        if (node === null || node.key === undefined) {
          break;
        }
        /* node:coverage enable */

        const [key, indexedValue] = node.key;
        if (key.startsWith(prefix) && key.endsWith(suffix)) {
          const result = await callback(trace, key, indexedValue);
          /* node:coverage disable */
          if (result !== undefined && !result.ok) {
            return result;
          }
          /* node:coverage enable */
        }

        index += step;
      }

      return makeSuccess(undefined);
    };

    const map = <SuccessT, ErrorCodeT extends string = never>(
      trace: Trace,
      callback: (trace: Trace, key: KeyT, value: IndexedValueT) => TypeOrPromisedType<Result<SuccessT, ErrorCodeT>>
    ): PR<SuccessT[], ErrorCodeT> => mapUsingForEach(trace, forEach, callback);

    return {
      forEach: makeAsyncResultFunc([import.meta.filename, 'forEach'], forEach),
      map: makeAsyncResultFunc([import.meta.filename, 'map'], map),
      entries: makeAsyncResultFunc([import.meta.filename, 'entries'], (trace) =>
        map(trace, (_trace, key, value) => makeSuccess([key, value] as [KeyT, IndexedValueT]))
      ),
      keys: makeAsyncResultFunc([import.meta.filename, 'keys'], (trace) => map(trace, (_trace, key) => makeSuccess(key)))
    };
  }
}

// Helpers

const isValueIncludedByFilters = <KeyT extends string, IndexedValueT>(
  key: KeyT,
  value: IndexedValueT,
  filters: IndexedEntryFilters<IndexedValueT>,
  entryComparator_: EntryComparator<KeyT, IndexedValueT>
): boolean => {
  let ok = true;
  ok = ok && (filters.gt === undefined || entryComparator_([key, value], [key, filters.gt]) > 0);
  ok = ok && (filters.gte === undefined || entryComparator_([key, value], [key, filters.gte]) >= 0);
  ok = ok && (filters.lt === undefined || entryComparator_([key, value], [key, filters.lt]) < 0);
  ok = ok && (filters.lte === undefined || entryComparator_([key, value], [key, filters.lte]) <= 0);
  return ok;
};

const makeEntryComparatorForConfig = <KeyT extends string, IndexedValueT>(
  config: IndexConfig<IndexedValueT>
): EntryComparator<KeyT, IndexedValueT> => {
  switch (config.type) {
    case 'key':
      return (a, b) => a[0].localeCompare(b[0]);
    case 'numeric':
      return (a, b) => Number(a[1]) - Number(b[1]);
    case 'string':
      return (a, b) => String(a[1]).localeCompare(String(b[1]));
  }
};

const mapUsingForEach = async <KeyT extends string, IndexedValueT, SuccessT, ErrorCodeT extends string = never>(
  trace: Trace,
  forEach: (
    trace: Trace,
    forEachCallback: (trace: Trace, key: KeyT, value: IndexedValueT) => TypeOrPromisedType<Result<undefined, ErrorCodeT> | void>
  ) => PR<undefined, ErrorCodeT>,
  mapperCallback: (trace: Trace, key: KeyT, value: IndexedValueT) => TypeOrPromisedType<Result<SuccessT, ErrorCodeT>>
): PR<SuccessT[], ErrorCodeT> => {
  const output: SuccessT[] = [];

  const forEachResult = await forEach(trace, (trace, key, value) => {
    const result = mapperCallback(trace, key, value);
    return withResolved(result, (result) => {
      /* node:coverage disable */
      if (!result.ok) {
        return result;
      }
      /* node:coverage enable */

      output.push(result.value);

      return makeSuccess(undefined);
    });
  });
  /* node:coverage disable */
  if (!forEachResult.ok) {
    return forEachResult;
  }
  /* node:coverage enable */

  return makeSuccess(output);
};
