import type sqlite3 from 'better-sqlite3';
import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ConflictError, InternalSchemaValidationError, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import type { IndexStore } from 'freedom-indexing-types';
import type {
  MutableObjectAccessor,
  MutableObjectStore,
  ObjectAccessor,
  ObjectStoreManagement,
  StorableObject
} from 'freedom-object-store-types';
import type { PageToken, Paginated } from 'freedom-paginated-data';
import { deserialize, serialize } from 'freedom-serialization';
import { get } from 'lodash-es';
import type { JsonValue, Schema } from 'yaschema';

import { SqliteObjectStoreKeyIndexStore } from '../internal/types/SqliteObjectStoreKeyIndexStore.ts';

export type SqliteObjectStoreConstructorArgs<KeyT extends string, T> = {
  db: sqlite3.Database;
  tableName: string;
  schema: Schema<T>;
  _keyType?: KeyT;
};

export class SqliteObjectStore<KeyT extends string, T> implements MutableObjectStore<KeyT, T>, ObjectStoreManagement<KeyT, T> {
  public readonly uid = makeUuid();

  public readonly keys: IndexStore<KeyT, unknown>;

  private readonly db_: sqlite3.Database;
  private readonly tableName_: string;

  private readonly schema_: Schema<T>;

  constructor({ db, tableName, schema }: SqliteObjectStoreConstructorArgs<KeyT, T>) {
    this.schema_ = schema;
    this.tableName_ = tableName;
    this.db_ = db;

    this.keys = new SqliteObjectStoreKeyIndexStore({ db: this.db_, tableName });
  }

  public readonly initializeDb = makeAsyncResultFunc([import.meta.filename, 'initializeDb'], async (): PR<undefined> => {
    this.db_.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName_} (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        isDeleted INTEGER NOT NULL,
        updateCount INTEGER NOT NULL
      );
    `);
    this.db_.exec(`
      CREATE INDEX IF NOT EXISTS ${this.tableName_}_index_deleted
      ON ${this.tableName_}
      (key, isDeleted)
      WHERE (isDeleted = 1);
    `);

    return makeSuccess(undefined);
  });

  // MutableObjectStore Methods

  public mutableObject(key: KeyT): MutableObjectAccessor<T> {
    const readonlyValues = this.object(key);

    const create = makeAsyncResultFunc(
      [import.meta.filename, 'mutableObject', 'create'],
      async (trace: Trace, initialValue: T): PR<T, 'conflict'> => {
        const cloned = await this.cloneValue_(trace, initialValue);
        /* node:coverage disable */
        if (!cloned.ok) {
          return cloned;
        }
        /* node:coverage enable */

        cloned.value.updateCount = 0;

        const initialStoredValue: StorableObject<T> = cloned.value;

        const serialized = await serialize(trace, initialStoredValue.storedValue, this.schema_);
        /* node:coverage disable */
        if (!serialized.ok) {
          return serialized;
        }
        /* node:coverage enable */

        const jsonString = JSON.stringify(serialized.value.serializedValue);

        const prepared = this.db_.prepare(`
          INSERT INTO ${this.tableName_}
          (key, value, isDeleted, updateCount)
          VALUES
          (?, ?, ?, ?)
        `);
        try {
          const result = prepared.run(key, jsonString, 0, 0);

          /* node:coverage disable */
          if (result.changes === 0) {
            return makeFailure(new ConflictError(trace, { message: `${key} already exists`, errorCode: 'conflict' }));
          }
          /* node:coverage enable */

          return makeSuccess(initialStoredValue.storedValue);
        } catch (e) {
          const code = get(e, 'code');
          if (code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
            return makeFailure(new ConflictError(trace, { message: `${key} already exists`, errorCode: 'conflict' }));
          } else {
            return makeFailure(new GeneralError(trace, e));
          }
        }
      }
    );

    const getMutable = makeAsyncResultFunc(
      [import.meta.filename, 'mutableObject', 'getMutable'],
      async (trace): PR<StorableObject<T>, 'not-found'> => {
        const prepared = this.db_.prepare<[KeyT], { value: string; updateCount: number }>(`
          SELECT value, updateCount
          FROM ${this.tableName_}
          WHERE isDeleted = 0 AND key = ?
        `);
        const result = prepared.get(key);

        /* node:coverage disable */
        if (result === undefined) {
          return makeFailure(new NotFoundError(trace, { message: `No object found for key: ${key}`, errorCode: 'not-found' }));
        }
        /* node:coverage enable */

        const serializedValue = JSON.parse(result.value) as JsonValue;
        const deserialized = await deserialize(trace, { serializedValue, valueSchema: this.schema_ });
        /* node:coverage disable */
        if (!deserialized.ok) {
          return deserialized;
        }
        /* node:coverage enable */

        return makeSuccess({ storedValue: deserialized.value, updateCount: result.updateCount });
      }
    );

    return {
      ...readonlyValues,

      create,

      delete: makeAsyncResultFunc([import.meta.filename, 'mutableObject', 'delete'], async (trace): PR<undefined, 'not-found'> => {
        const prepared = this.db_.prepare(`
          UPDATE ${this.tableName_}
          SET isDeleted = ?
          WHERE isDeleted = 0 AND key = ?
        `);
        const result = prepared.run(1, key);

        if (result.changes === 0) {
          return makeFailure(new NotFoundError(trace, { message: `No object found for key: ${key}`, errorCode: 'not-found' }));
        }

        return makeSuccess(undefined);
      }),

      getMutable,

      update: makeAsyncResultFunc(
        [import.meta.filename, 'mutableObject', 'update'],
        async (trace, newValue: StorableObject<T>): PR<undefined, 'not-found' | 'out-of-date'> => {
          const serialized = await serialize(trace, newValue.storedValue, this.schema_);
          /* node:coverage disable */
          if (!serialized.ok) {
            return serialized;
          }
          /* node:coverage enable */

          const jsonString = JSON.stringify(serialized.value.serializedValue);

          const prepared = this.db_.prepare(`
            UPDATE ${this.tableName_}
            SET value = ?, updateCount = ?
            WHERE isDeleted = 0 AND key = ? AND updateCount = ?
          `);
          const result = prepared.run(jsonString, newValue.updateCount + 1, key, newValue.updateCount);

          if (result.changes === 0) {
            return makeFailure(
              new ConflictError(trace, {
                message: "Value doesn't exist for key, was deleted, or is out of date",
                errorCode: 'out-of-date'
              })
            );
          }

          return makeSuccess(undefined);
        }
      )
    };
  }

  // ObjectStore Methods

  public object(key: KeyT): ObjectAccessor<T> {
    return {
      exists: makeAsyncResultFunc([import.meta.filename, 'object', 'exists'], async (_trace): PR<boolean> => {
        const prepared = this.db_.prepare<[KeyT], { count: number }>(`
          SELECT count(*) AS count
          FROM ${this.tableName_}
          WHERE isDeleted = 0 AND key = ?
        `);
        const result = prepared.get(key);

        return makeSuccess((result?.count ?? 0) > 1);
      }),

      get: makeAsyncResultFunc([import.meta.filename, 'object', 'get'], async (trace): PR<T, 'not-found'> => {
        const prepared = this.db_.prepare<[KeyT], { value: string }>(`
          SELECT value
          FROM ${this.tableName_}
          WHERE isDeleted = 0 AND key = ?
        `);
        const result = prepared.get(key);

        /* node:coverage disable */
        if (result === undefined) {
          return makeFailure(new NotFoundError(trace, { message: `No object found for key: ${key}`, errorCode: 'not-found' }));
        }
        /* node:coverage enable */

        const serializedValue = JSON.parse(result.value) as JsonValue;
        const deserialized = await deserialize(trace, { serializedValue, valueSchema: this.schema_ });
        /* node:coverage disable */
        if (!deserialized.ok) {
          return deserialized;
        }
        /* node:coverage enable */

        return makeSuccess(deserialized.value);
      })
    };
  }

  public async getMultiple(trace: Trace, keys: KeyT[]): PR<{ found: Partial<Record<KeyT, T>>; notFound: KeyT[] }> {
    const found: Partial<Record<KeyT, T>> = {};

    const prepared = this.db_.prepare<KeyT[], { key: KeyT; value: string }>(`
      SELECT key, value
      FROM ${this.tableName_}
      WHERE isDeleted = 0 AND key IN (${Array(keys.length).fill('?').join(',')})
    `);
    const rows = prepared.all(...keys);

    for (const { key, value } of rows) {
      const serializedValue = JSON.parse(value) as JsonValue;
      const deserialized = await deserialize(trace, { serializedValue, valueSchema: this.schema_ });
      if (!deserialized.ok) {
        return deserialized;
      }

      found[key] = deserialized.value;
    }

    const notFound = keys.filter((key) => found[key] === undefined);

    return makeSuccess({ found, notFound });
  }

  // ObjectStoreManagementAccessor Methods

  public readonly getDeletedKeys = makeAsyncResultFunc(
    [import.meta.filename, 'getDeletedKeys'],
    async (_trace: Trace, startFromPageToken?: PageToken): PR<Paginated<KeyT>> => {
      /* node:coverage disable */
      if (startFromPageToken !== undefined) {
        return makeSuccess({ items: [] });
      }
      /* node:coverage enable */

      const prepared = this.db_.prepare<[], { key: KeyT }>(`
        SELECT key
        FROM ${this.tableName_}
        WHERE isDeleted = 1
      `);
      const rows = prepared.all();

      const deletedKeys = rows.map(({ key }) => key);

      return makeSuccess({ items: deletedKeys, estCount: deletedKeys.length });
    }
  );

  public readonly sweep = makeAsyncResultFunc([import.meta.filename, 'sweep'], async (trace: Trace): PR<KeyT[]> => {
    const deletedKeys = await this.getDeletedKeys(trace);
    /* node:coverage disable */
    if (!deletedKeys.ok) {
      return deletedKeys;
    }
    /* node:coverage enable */

    const prepared = this.db_.prepare<KeyT[]>(`
      DELETE
      FROM ${this.tableName_}
      WHERE key IN (${Array(deletedKeys.value.items.length).fill('?').join(',')})
    `);
    prepared.run(...deletedKeys.value.items);

    return makeSuccess(deletedKeys.value.items);
  });

  // Private Methods

  private readonly cloneValue_ = makeAsyncResultFunc(
    [import.meta.filename, 'cloneValue_'],
    async (trace: Trace, value: T): PR<StorableObject<T>> => {
      const cloning = await this.schema_.cloneValueAsync(value);
      /* node:coverage disable */
      if (cloning.error !== undefined) {
        return makeFailure(new InternalSchemaValidationError(trace, { message: cloning.error }));
      }
      /* node:coverage enable */

      const output: StorableObject<T> = { storedValue: cloning.cloned, updateCount: 0 };

      return makeSuccess(output);
    }
  );
}
