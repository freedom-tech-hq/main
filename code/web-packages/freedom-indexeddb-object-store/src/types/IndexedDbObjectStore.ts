import type { PR } from 'freedom-async';
import { allResultsMapped, excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ConflictError, generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import type { IndexStore } from 'freedom-indexing-types';
import { withAcquiredLock } from 'freedom-locking-types';
import type { MutableObjectAccessor, MutableObjectStore, ObjectAccessor, StorableObject } from 'freedom-object-store-types';
import { deserialize, serialize } from 'freedom-serialization';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import type { JsonValue, Schema } from 'yaschema';
import { schema } from 'yaschema';

import { IndexedDbObjectStoreKeyIndexStore } from '../internal/types/IndexedDbObjectStoreKeyIndexStore.ts';
import { deleteKv } from '../internal/utils/deleteKv.ts';
import { getLockStore } from '../internal/utils/getLockStore.ts';
import { readKv } from '../internal/utils/readKv.ts';
import { writeKv } from '../internal/utils/writeKv.ts';

export interface StoredObject<T> {
  storedValue: T;
  updateCount: number;
}

export type IndexedDbObjectStoreConstructorArgs<KeyT extends string, T> = {
  db: IDBDatabase;
  storeName: string;
  schema: Schema<T>;
  _keyType?: KeyT;
};

export class IndexedDbObjectStore<KeyT extends string, T> implements MutableObjectStore<KeyT, T> {
  public readonly uid = makeUuid();

  public readonly keys: IndexStore<KeyT, unknown>;

  private readonly db_: IDBDatabase;
  private readonly storeName_: string;

  private readonly storedSchema_: Schema<StoredObject<T>>;

  constructor({ db, storeName, schema: valueSchema }: IndexedDbObjectStoreConstructorArgs<KeyT, T>) {
    this.storedSchema_ = schema.object_noAutoOptional<StoredObject<T>>({
      storedValue: valueSchema,
      updateCount: schema.number()
    });

    this.storeName_ = storeName;
    this.db_ = db;

    this.keys = new IndexedDbObjectStoreKeyIndexStore({ db: this.db_, storeName });
  }

  // MutableObjectStore Methods

  public mutableObject(key: KeyT): MutableObjectAccessor<T> {
    const readonlyValues = this.object(key);

    const create = makeAsyncResultFunc(
      [import.meta.filename, 'mutableObject', 'create'],
      async (trace: Trace, initialValue: T): PR<T, 'conflict'> => {
        const initialStoredValue: StoredObject<T> = {
          storedValue: initialValue,
          updateCount: 0
        };

        const serialized = await serialize(trace, initialStoredValue, this.storedSchema_);
        /* node:coverage disable */
        if (!serialized.ok) {
          return serialized;
        }
        /* node:coverage enable */

        const lockStore = getLockStore();

        const lockKey = `${this.db_.name}.${this.storeName_}.${key}`;
        const completed = await withAcquiredLock(trace, lockStore.lock(lockKey), {}, async (): PR<T, 'conflict'> => {
          const existingValue = await disableLam(trace, 'not-found', (trace) =>
            readKv<KeyT, JsonValue>(trace, this.db_, { storeName: this.storeName_, key })
          );
          if (!existingValue.ok) {
            if (existingValue.value.errorCode === 'not-found') {
              const created = await writeKv<KeyT, JsonValue>(trace, this.db_, {
                storeName: this.storeName_,
                key,
                value: serialized.value.serializedValue
              });
              if (!created.ok) {
                return created;
              }

              return makeSuccess(initialStoredValue.storedValue);
            }

            return excludeFailureResult(existingValue, 'not-found');
          }

          return makeFailure(new ConflictError(trace, { message: `${key} already exists`, errorCode: 'conflict' }));
        });
        if (!completed.ok) {
          return generalizeFailureResult(trace, completed, 'lock-timeout');
        }

        return makeSuccess(completed.value);
      }
    );

    const getMutable = makeAsyncResultFunc(
      [import.meta.filename, 'mutableObject', 'getMutable'],
      async (trace): PR<StorableObject<T>, 'not-found'> => {
        const found = await readKv<KeyT, JsonValue>(trace, this.db_, { storeName: this.storeName_, key });
        if (!found.ok) {
          return found;
        }

        const deserialized = await deserialize(trace, { serializedValue: found.value, valueSchema: this.storedSchema_ });
        /* node:coverage disable */
        if (!deserialized.ok) {
          return deserialized;
        }
        /* node:coverage enable */

        return makeSuccess({ storedValue: deserialized.value.storedValue, updateCount: deserialized.value.updateCount });
      }
    );

    return {
      ...readonlyValues,

      create,

      delete: makeAsyncResultFunc([import.meta.filename, 'mutableObject', 'delete'], async (trace): PR<undefined, 'not-found'> => {
        const lockStore = getLockStore();

        const lockKey = `${this.db_.name}.${this.storeName_}.${key}`;
        const completed = await withAcquiredLock(trace, lockStore.lock(lockKey), {}, async (): PR<undefined, 'not-found'> => {
          const found = await disableLam(trace, 'not-found', (trace) =>
            readKv<KeyT, JsonValue>(trace, this.db_, { storeName: this.storeName_, key })
          );
          if (!found.ok) {
            return found;
          }

          const deleted = await deleteKv<KeyT>(trace, this.db_, { storeName: this.storeName_, key });
          if (!deleted.ok) {
            return deleted;
          }

          return makeSuccess(undefined);
        });
        if (!completed.ok) {
          return generalizeFailureResult(trace, completed, 'lock-timeout');
        }

        return makeSuccess(completed.value);
      }),

      getMutable,

      update: makeAsyncResultFunc(
        [import.meta.filename, 'mutableObject', 'update'],
        async (trace, newValue: StorableObject<T>): PR<undefined, 'not-found' | 'out-of-date'> => {
          const lockStore = getLockStore();

          const lockKey = `${this.db_.name}.${this.storeName_}.${key}`;
          const completed = await withAcquiredLock(
            trace,
            lockStore.lock(lockKey),
            {},
            async (): PR<undefined, 'not-found' | 'out-of-date'> => {
              const found = await disableLam(trace, 'not-found', (trace) =>
                readKv<KeyT, JsonValue>(trace, this.db_, { storeName: this.storeName_, key })
              );
              if (!found.ok) {
                return found;
              }

              const deserialized = await deserialize(trace, { serializedValue: found.value, valueSchema: this.storedSchema_ });
              /* node:coverage disable */
              if (!deserialized.ok) {
                return deserialized;
              } else if (deserialized.value.updateCount !== newValue.updateCount) {
                return makeFailure(
                  new ConflictError(trace, {
                    message: `Expected updateCount: ${deserialized.value.updateCount}, found: ${newValue.updateCount}`,
                    errorCode: 'out-of-date'
                  })
                );
              }
              /* node:coverage enable */

              deserialized.value.storedValue = newValue.storedValue;
              deserialized.value.updateCount += 1;

              const serialized = await serialize(trace, deserialized.value, this.storedSchema_);
              if (!serialized.ok) {
                return serialized;
              }

              const stored = await writeKv<KeyT, JsonValue>(trace, this.db_, {
                storeName: this.storeName_,
                key,
                value: serialized.value.serializedValue
              });
              if (!stored.ok) {
                return stored;
              }

              return makeSuccess(undefined);
            }
          );
          if (!completed.ok) {
            return generalizeFailureResult(trace, completed, 'lock-timeout');
          }

          return makeSuccess(completed.value);
        }
      )
    };
  }

  // ObjectStore Methods

  public object(key: KeyT): ObjectAccessor<T> {
    return {
      exists: makeAsyncResultFunc([import.meta.filename, 'object', 'exists'], async (trace): PR<boolean> => {
        const found = await disableLam(trace, 'not-found', (trace) =>
          readKv<KeyT, JsonValue>(trace, this.db_, { storeName: this.storeName_, key })
        );
        if (!found.ok) {
          if (found.value.errorCode === 'not-found') {
            return makeSuccess(false);
          }
          return excludeFailureResult(found, 'not-found');
        }

        return makeSuccess(true);
      }),

      get: makeAsyncResultFunc([import.meta.filename, 'object', 'get'], async (trace): PR<T, 'not-found'> => {
        const found = await readKv<KeyT, JsonValue>(trace, this.db_, { storeName: this.storeName_, key });
        if (!found.ok) {
          return found;
        }

        const deserialized = await deserialize(trace, { serializedValue: found.value, valueSchema: this.storedSchema_ });
        /* node:coverage disable */
        if (!deserialized.ok) {
          return deserialized;
        }
        /* node:coverage enable */

        return makeSuccess(deserialized.value.storedValue);
      })
    };
  }

  public async getMultiple(trace: Trace, keys: KeyT[]): PR<{ found: Partial<Record<KeyT, T>>; notFound: KeyT[] }> {
    const found: Partial<Record<KeyT, T>> = {};
    const notFound: KeyT[] = [];

    const completed = await allResultsMapped(trace, keys, {}, async (trace, key): PR<undefined> => {
      const item = await this.object(key).get(trace);
      if (!item.ok) {
        if (item.value.errorCode === 'not-found') {
          notFound.push(key);
        } else {
          return excludeFailureResult(item, 'not-found');
        }
      } else {
        found[key] = item.value;
      }

      return makeSuccess(undefined);
    });
    if (!completed.ok) {
      return completed;
    }

    return makeSuccess({ found, notFound });
  }
}
