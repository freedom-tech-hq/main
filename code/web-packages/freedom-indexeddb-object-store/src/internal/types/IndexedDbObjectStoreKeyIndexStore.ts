import type { PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, withResolved } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import type { IndexedEntries, IndexedEntryOptions, IndexStore } from 'freedom-indexing-types';
import type { TypeOrPromisedType } from 'yaschema';

import { listKvKeys } from '../utils/listKvKeys.ts';

export interface IndexedDbObjectStoreKeyIndexStoreConstructorArgs {
  db: IDBDatabase;
  storeName: string;
}

export class IndexedDbObjectStoreKeyIndexStore<KeyT extends string> implements IndexStore<KeyT, unknown> {
  public readonly uid = makeUuid();

  private readonly db_: IDBDatabase;
  private readonly storeName_: string;

  constructor({ db, storeName }: IndexedDbObjectStoreKeyIndexStoreConstructorArgs) {
    this.db_ = db;
    this.storeName_ = storeName;
  }

  // IndexStore Methods

  public readonly count: IndexStore<KeyT, unknown>['count'] = makeAsyncResultFunc(
    [import.meta.filename, 'keys.count'],
    async (trace, options): PR<number> => {
      const keys = await listKvKeys(trace, this.db_, this.storeName_);
      if (!keys.ok) {
        return keys;
      }

      const matchingKeys = keys.value.filter((key) => {
        if ((options?.prefix?.length ?? 0) > 0) {
          if (!key.startsWith(options!.prefix!)) {
            return false;
          }
        }

        if ((options?.suffix?.length ?? 0) > 0) {
          if (!key.endsWith(options!.suffix!)) {
            return false;
          }
        }

        return true;
      });

      return makeSuccess(matchingKeys.length);
    }
  );

  public readonly asc: IndexStore<KeyT, unknown>['asc'] = ({ prefix, suffix, offset, limit }: IndexedEntryOptions = {}): IndexedEntries<
    KeyT,
    unknown
  > => {
    return this.makeIndexedEntriesForOrder_({ prefix: prefix ?? '', suffix: suffix ?? '', offset: offset ?? 0, limit, asc: true });
  };

  public readonly desc: IndexStore<KeyT, unknown>['desc'] = ({ prefix, suffix, offset, limit }: IndexedEntryOptions = {}): IndexedEntries<
    KeyT,
    unknown
  > => {
    return this.makeIndexedEntriesForOrder_({ prefix: prefix ?? '', suffix: suffix ?? '', offset: offset ?? 0, limit, asc: false });
  };

  // Private Methods

  private makeIndexedEntriesForOrder_({
    prefix,
    suffix,
    offset,
    limit,
    asc
  }: {
    prefix: string;
    suffix: string;
    offset: number;
    limit?: number;
    asc: boolean;
  }): IndexedEntries<KeyT, unknown> {
    const forEach = async <ErrorCodeT extends string = never>(
      trace: Trace,
      callback: (trace: Trace, key: KeyT, value: unknown) => TypeOrPromisedType<Result<undefined, ErrorCodeT> | void>
    ): PR<undefined, ErrorCodeT> => {
      const keys = await listKvKeys<KeyT>(trace, this.db_, this.storeName_);
      if (!keys.ok) {
        return keys;
      }

      const matchingKeys = keys.value
        .filter((key) => {
          if (prefix.length > 0) {
            if (!key.startsWith(prefix)) {
              return false;
            }
          }

          if (suffix.length > 0) {
            if (!key.endsWith(suffix)) {
              return false;
            }
          }

          return true;
        })
        .sort();

      if (!asc) {
        matchingKeys.reverse();
      }

      const limitedKeys = matchingKeys.slice(offset, limit !== undefined ? offset + limit : undefined);

      for (const key of limitedKeys) {
        await callback(trace, key, undefined);
      }

      return makeSuccess(undefined);
    };

    const map = <SuccessT, ErrorCodeT extends string = never>(
      trace: Trace,
      callback: (trace: Trace, key: KeyT, value: unknown) => TypeOrPromisedType<Result<SuccessT, ErrorCodeT>>
    ): PR<SuccessT[], ErrorCodeT> => mapUsingForEach(trace, forEach, callback);

    return {
      forEach: makeAsyncResultFunc([import.meta.filename, 'forEach'], forEach),
      map: makeAsyncResultFunc([import.meta.filename, 'map'], map),
      entries: makeAsyncResultFunc([import.meta.filename, 'entries'], (trace) =>
        map(trace, (_trace, key, value) => makeSuccess([key, value] as [KeyT, unknown]))
      ),
      keys: makeAsyncResultFunc([import.meta.filename, 'keys'], (trace) => map(trace, (_trace, key) => makeSuccess(key)))
    };
  }
}

// Helpers

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
