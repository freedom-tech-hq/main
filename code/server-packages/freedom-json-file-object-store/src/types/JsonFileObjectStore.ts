import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import {
  InMemoryObjectStore,
  type MutableObjectAccessor,
  type MutableObjectStore,
  type ObjectAccessor,
  type StorableObject
} from 'freedom-object-store-types';
import { parse, stringify } from 'freedom-serialization';
import { TaskQueue } from 'freedom-task-queue';
import { once } from 'lodash-es';
import { type Schema, schema } from 'yaschema';

export type JsonFileObjectStoreConstructorArgs<KeyT extends string, T> = {
  path: string;
  schema: Schema<T>;
  _keyType?: KeyT;
};

export class JsonFileObjectStore<KeyT extends string, T> implements MutableObjectStore<KeyT, T> {
  public readonly uid = makeUuid();

  public readonly inMemoryStore_: InMemoryObjectStore<KeyT, T>;
  public get keys() {
    return this.inMemoryStore_.keys;
  }

  private readonly path_: string;
  private readonly persistenceTaskQueue_ = new TaskQueue(makeTrace(import.meta.filename));

  private readonly recordSchema_: Schema<Partial<Record<KeyT, T>>>;

  constructor({ path, schema: valueSchema }: JsonFileObjectStoreConstructorArgs<KeyT, T>) {
    this.recordSchema_ = schema.record(schema.string(), valueSchema);
    this.path_ = path;

    this.inMemoryStore_ = new InMemoryObjectStore<KeyT, T>({ schema: valueSchema });
    this.persistenceTaskQueue_.start();
  }

  /** Optionally call to forcibly load.  Otherwise, this will happen lazily */
  public readonly initialize = makeAsyncResultFunc(
    [import.meta.filename, 'initialize'],
    async (trace): PR<undefined> => await this.loadIfNeeded_(trace)
  );

  /** Wait for any outstanding persistence operations to complete */
  public readonly waitForPersistence = makeAsyncResultFunc([import.meta.filename, 'waitForPersistence'], async (_trace): PR<undefined> => {
    await this.persistenceTaskQueue_.wait();
    return makeSuccess(undefined);
  });

  // MutableObjectStore Methods

  public mutableObject(key: KeyT): MutableObjectAccessor<T> {
    const readonlyValues = this.object(key);

    const create = makeAsyncResultFunc(
      [import.meta.filename, 'mutableObject', 'create'],
      async (trace: Trace, initialValue: T): PR<T, 'conflict'> => {
        await uncheckedResult(this.loadIfNeeded_(trace));

        const created = await this.inMemoryStore_.mutableObject(key).create(trace, initialValue);
        if (!created.ok) {
          return created;
        }

        this.persistenceTaskQueue_.add({ key: 'persist', version: makeUuid() }, this.persistToFile_);

        return makeSuccess(created.value);
      }
    );

    const getMutable = makeAsyncResultFunc(
      [import.meta.filename, 'mutableObject', 'getMutable'],
      async (trace): PR<StorableObject<T>, 'not-found'> => {
        await uncheckedResult(this.loadIfNeeded_(trace));

        return await this.inMemoryStore_.mutableObject(key).getMutable(trace);
      }
    );

    return {
      ...readonlyValues,

      create,

      delete: makeAsyncResultFunc([import.meta.filename, 'mutableObject', 'delete'], async (trace): PR<undefined, 'not-found'> => {
        await uncheckedResult(this.loadIfNeeded_(trace));

        const deleted = await this.inMemoryStore_.mutableObject(key).delete(trace);
        if (!deleted.ok) {
          return deleted;
        }

        this.persistenceTaskQueue_.add({ key: 'persist', version: makeUuid() }, this.persistToFile_);

        return makeSuccess(deleted.value);
      }),

      getMutable,

      update: makeAsyncResultFunc(
        [import.meta.filename, 'mutableObject', 'update'],
        async (trace, newValue: StorableObject<T>): PR<undefined, 'not-found' | 'out-of-date'> => {
          await uncheckedResult(this.loadIfNeeded_(trace));

          const updated = await this.inMemoryStore_.mutableObject(key).update(trace, newValue);
          if (!updated.ok) {
            return updated;
          }

          this.persistenceTaskQueue_.add({ key: 'persist', version: makeUuid() }, this.persistToFile_);

          return makeSuccess(updated.value);
        }
      )
    };
  }

  // ObjectStore Methods

  public object(key: KeyT): ObjectAccessor<T> {
    return {
      exists: makeAsyncResultFunc([import.meta.filename, 'object', 'exists'], async (trace): PR<boolean> => {
        await uncheckedResult(this.loadIfNeeded_(trace));

        return await this.inMemoryStore_.object(key).exists(trace);
      }),

      get: makeAsyncResultFunc([import.meta.filename, 'object', 'get'], async (trace): PR<T, 'not-found'> => {
        await uncheckedResult(this.loadIfNeeded_(trace));

        return await this.inMemoryStore_.object(key).get(trace);
      })
    };
  }

  public async getMultiple(trace: Trace, keys: KeyT[]): PR<{ found: Partial<Record<KeyT, T>>; notFound: KeyT[] }> {
    await uncheckedResult(this.loadIfNeeded_(trace));

    return await this.inMemoryStore_.getMultiple(trace, keys);
  }

  // Private Methods

  private readonly loadIfNeeded_ = makeAsyncResultFunc(
    [import.meta.filename, 'loadIfNeeded_'],
    once(async (trace): PR<undefined> => {
      let jsonString = '{}';
      try {
        jsonString = await fs.readFile(this.path_, 'utf-8');
      } catch (_e) {
        // Ignoring file read errors, since this probably means the file doesn't exist
      }

      const parsed = await parse(trace, jsonString, this.recordSchema_);
      /* node:coverage disable */
      if (!parsed.ok) {
        return parsed;
      }
      /* node:coverage enable */

      const initialized = await allResultsMapped(trace, objectEntries(parsed.value), {}, async (trace, [key, value]) => {
        if (value === undefined) {
          return makeSuccess(undefined);
        }

        const created = await this.inMemoryStore_.mutableObject(key).create(trace, value);
        /* node:coverage disable */
        if (!created.ok) {
          // Conflicts should never happen here since we're initializing a new object store
          return generalizeFailureResult(trace, created, 'conflict');
        }
        /* node:coverage enable */

        return makeSuccess(undefined);
      });
      /* node:coverage disable */
      if (!initialized.ok) {
        return initialized;
      }
      /* node:coverage enable */

      return makeSuccess(undefined);
    })
  );

  private readonly persistToFile_ = makeAsyncResultFunc([import.meta.filename, 'persistToFile_'], async (trace): PR<undefined> => {
    const keys = await this.inMemoryStore_.keys.asc().keys(trace);
    /* node:coverage disable */
    if (!keys.ok) {
      return keys;
    }
    /* node:coverage enable */

    const got = await this.inMemoryStore_.getMultiple(trace, keys.value);
    /* node:coverage disable */
    if (!got.ok) {
      return got;
    }
    /* node:coverage enable */

    const jsonString = await stringify(trace, got.value.found, this.recordSchema_, { space: 2 });
    /* node:coverage disable */
    if (!jsonString.ok) {
      return jsonString;
    }
    /* node:coverage enable */

    await fs.writeFile(this.path_, jsonString.value, 'utf-8');

    return makeSuccess(undefined);
  });
}
