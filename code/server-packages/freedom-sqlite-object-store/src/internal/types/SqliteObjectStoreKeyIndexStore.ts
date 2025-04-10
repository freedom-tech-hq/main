import type sqlite3 from 'better-sqlite3';
import type { PR, Result } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess, withResolved } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import type { IndexedEntries, IndexedEntryOptions, IndexStore } from 'freedom-indexing-types';
import type { TypeOrPromisedType } from 'yaschema';

export interface SqliteObjectStoreKeyIndexStoreConstructorArgs {
  db: sqlite3.Database;
  tableName: string;
}

export class SqliteObjectStoreKeyIndexStore<KeyT extends string> implements IndexStore<KeyT, unknown> {
  public readonly uid = makeUuid();

  private readonly db_: sqlite3.Database;
  private readonly tableName_: string;

  constructor({ db, tableName }: SqliteObjectStoreKeyIndexStoreConstructorArgs) {
    this.db_ = db;
    this.tableName_ = tableName;
  }

  // IndexStore Methods

  public readonly count: IndexStore<KeyT, unknown>['count'] = makeAsyncResultFunc(
    [import.meta.filename, 'keys.count'],
    async (trace, options): PR<number> => {
      const { andParams, args } = prepOptions(options);
      const prepared = this.db_.prepare<unknown[], { count: number }>(`
        SELECT count(*) AS count
        FROM ${this.tableName_}
        WHERE isDeleted = 0 ${andParams.length > 0 ? `AND ${andParams.join(' AND ')}` : ''}
      `);
      const result = prepared.get(args);

      /* node:coverage disable */
      if (result === undefined) {
        return makeFailure(new GeneralError(trace, new Error('Failed to count keys')));
      }
      /* node:coverage enable */

      return makeSuccess(result.count);
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
      const { andParams, args } = prepOptions({ prefix, suffix });

      args.push(limit ?? -1);
      args.push(offset);

      const prepared = this.db_.prepare<unknown[], { key: KeyT }>(`
        SELECT key FROM ${this.tableName_} 
        WHERE isDeleted = 0 ${andParams.length > 0 ? `AND ${andParams.join(' AND ')}` : ''}
        ORDER BY key ${asc ? 'ASC' : 'DESC'}
        LIMIT ? OFFSET ?
      `);
      const rows = prepared.all(args);

      for (const { key } of rows) {
        const result = await callback(trace, key, undefined);
        /* node:coverage disable */
        if (result !== undefined && !result.ok) {
          return result;
        }
        /* node:coverage enable */
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

const prepOptions = (options: Omit<IndexedEntryOptions, 'limit' | 'offset'> | undefined) => {
  const andParams: string[] = [];
  const args: unknown[] = [];

  if ((options?.prefix?.length ?? 0) > 0) {
    andParams.push('key LIKE ?');
    if ((options?.suffix?.length ?? 0) > 0) {
      args.push(`${options?.prefix ?? ''}%${options?.suffix ?? ''}`);
    } else {
      args.push(`${options?.prefix ?? ''}%`);
    }
  } else if ((options?.suffix?.length ?? 0) > 0) {
    andParams.push('key LIKE ?');
    args.push(`%${options?.suffix ?? ''}`);
  }

  return { andParams, args };
};
