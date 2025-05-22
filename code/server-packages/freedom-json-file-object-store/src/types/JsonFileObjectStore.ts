import fs from 'node:fs/promises';

import { makeFailure, type PR, type Result, uncheckedResult } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { ConflictError, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import type { IndexedEntries, IndexStore } from 'freedom-indexing-types';
import { InMemoryIndexStore } from 'freedom-indexing-types';
import type { MutableObjectAccessor, MutableObjectStore, ObjectAccessor, StorableObject } from 'freedom-object-store-types';
import { parse, stringify } from 'freedom-serialization';
import { isEmpty } from 'lodash-es';
import { type Schema, schema } from 'yaschema';

export type JsonFileObjectStoreConstructorArgs<KeyT extends string, T> = {
  path: string;
  schema: Schema<T>;
  _keyType?: KeyT;
};

export class JsonFileObjectStore<KeyT extends string, T> implements MutableObjectStore<KeyT, T> {
  public readonly uid = makeUuid();

  private readonly path_: string;

  private readonly recordSchema_: Schema<Partial<Record<KeyT, T>>>;

  constructor({ path, schema: valueSchema }: JsonFileObjectStoreConstructorArgs<KeyT, T>) {
    this.recordSchema_ = schema.record(schema.string(), valueSchema);
    this.path_ = path;
  }

  public get keys(): IndexStore<KeyT, unknown> {
    const getStore = async (trace: Trace) => {
      return await uncheckedResult(
        this.accessFile_(trace, false, (contents) => {
          const impl = new InMemoryIndexStore<KeyT, unknown>({ config: { type: 'key' } });
          for (const key of Object.keys(contents) as KeyT[]) {
            impl.addToIndex(trace, key, undefined);
          }

          return makeSuccess(impl);
        })
      );
    };

    return {
      uid: this.uid,
      count: makeAsyncResultFunc([import.meta.filename, 'count'], async (...args): PR<number> => {
        return await (await getStore(args[0])).count(...args);
      }),

      asc: (options, filters): IndexedEntries<KeyT, T> => {
        return {
          entries: () => {
            throw new Error('Not implemented');
          },
          forEach: () => {
            throw new Error('Not implemented');
          },
          keys: async (trace) => {
            if (!isEmpty(filters)) {
              throw new Error('Not implemented');
            }
            return await (await getStore(trace)).asc(options).keys(trace);
          },
          map: () => {
            throw new Error('Not implemented');
          }
        };
      },

      desc: (): IndexedEntries<KeyT, T> => {
        throw new Error('Not implemented');
      }
    };
  }

  // MutableObjectStore Methods

  public mutableObject(key: KeyT): MutableObjectAccessor<T> {
    const readonlyValues = this.object(key);

    const create = makeAsyncResultFunc(
      [import.meta.filename, 'mutableObject', 'create'],
      async (trace: Trace, initialValue: T): PR<T, 'conflict'> => {
        return await this.accessFile_(trace, true, (contents): Result<T, 'conflict'> => {
          if (Object.hasOwn(contents, key)) {
            return makeFailure(new ConflictError(trace, { message: `${key} already exists`, errorCode: 'conflict' }));
          } else {
            contents[key] = initialValue;
            return makeSuccess(initialValue);
          }
        });
      }
    );

    return {
      ...readonlyValues,

      create,

      delete: makeAsyncResultFunc([import.meta.filename, 'mutableObject', 'delete'], async (trace): PR<undefined, 'not-found'> => {
        return await this.accessFile_(trace, true, (contents): Result<undefined, 'not-found'> => {
          if (!Object.hasOwn(contents, key)) {
            return makeFailure(new NotFoundError(trace, { message: `No object found for key: ${key}`, errorCode: 'not-found' }));
          } else {
            delete contents[key];
            return makeSuccess(undefined);
          }
        });
      }),

      getMutable: async (...args) => {
        const result = await readonlyValues.get(...args);
        if (!result.ok) {
          return result;
        }

        return makeSuccess<StorableObject<T>>({
          storedValue: result.value,
          updateCount: 0 // We do not have this information
        });
      },

      update: makeAsyncResultFunc(
        [import.meta.filename, 'mutableObject', 'update'],
        async (trace, newValue: StorableObject<T>): PR<undefined, 'not-found' | 'out-of-date'> => {
          return await this.accessFile_(trace, true, (contents): Result<undefined, 'not-found' | 'out-of-date'> => {
            if (!Object.hasOwn(contents, key)) {
              return makeFailure(new NotFoundError(trace, { message: `No object found for key: ${key}`, errorCode: 'not-found' }));
            }

            contents[key] = newValue.storedValue;
            return makeSuccess(undefined);
          });
        }
      )
    };
  }

  // ObjectStore Methods

  public object(key: KeyT): ObjectAccessor<T> {
    return {
      exists: makeAsyncResultFunc([import.meta.filename, 'object', 'exists'], async (trace): PR<boolean> => {
        const result = await this.accessFile_(trace, false, (contents): Result<boolean> => {
          return makeSuccess(Object.hasOwn(contents, key));
        });
        return result;
      }),

      get: makeAsyncResultFunc([import.meta.filename, 'object', 'get'], async (trace): PR<T, 'not-found'> => {
        return await this.accessFile_(trace, false, (contents): Result<T, 'not-found'> => {
          if (!Object.hasOwn(contents, key)) {
            return makeFailure(new NotFoundError(trace, { message: `No object found for key: ${key}`, errorCode: 'not-found' }));
          }

          return makeSuccess<T>(contents[key]!);
        });
      })
    };
  }

  public async getMultiple(trace: Trace, keys: KeyT[]): PR<{ found: Partial<Record<KeyT, T>>; notFound: KeyT[] }> {
    return await this.accessFile_(trace, false, (contents): Result<{ found: Partial<Record<KeyT, T>>; notFound: KeyT[] }> => {
      const found: Partial<Record<KeyT, T>> = {};
      const notFound: KeyT[] = [];

      for (const key of keys) {
        if (Object.hasOwn(contents, key)) {
          found[key] = contents[key];
        } else {
          notFound.push(key);
        }
      }

      return makeSuccess({ found, notFound });
    });
  }

  // Private Methods

  /**
   * Read file from disk, execute callback on contents, save if needed, and forget.
   * This method never caches the value, always reads from disk, and doesn't maintain any state.
   * TODO: Implement locking (don't forget to make it cross-process)
   */
  private readonly accessFile_ = makeAsyncResultFunc(
    [import.meta.filename, 'accessFile_'],
    async <R, E extends string = never>(
      trace: Trace,
      writeAfter: boolean,
      callback: (contents: Partial<Record<KeyT, T>>) => Result<R, E>
    ): PR<R, E> => {
      // Read from disk
      let jsonString = '{}';
      try {
        jsonString = await fs.readFile(this.path_, 'utf-8');
      } catch (_e) {
        // Ignoring file read errors, since this probably means the file doesn't exist
        // TODO: Make distinction
      }

      // Parse the file contents
      const parseResult = await parse(trace, jsonString, this.recordSchema_);
      if (!parseResult.ok) {
        return parseResult;
      }

      // Execute the callback with the contents
      const result = callback(parseResult.value);
      if (!result.ok) {
        return result;
      }

      if (!writeAfter) {
        return result;
      }

      // Only write back to disk if the callback modified the contents
      // This is determined by checking if the result is successful
      const writeResult = await stringify(trace, parseResult.value, this.recordSchema_, { space: 2 });
      if (!writeResult.ok) {
        return writeResult;
      }

      // Write back to disk
      await fs.writeFile(this.path_, writeResult.value, 'utf-8');

      // Return the result from the callback
      return result;
    }
  );
}
