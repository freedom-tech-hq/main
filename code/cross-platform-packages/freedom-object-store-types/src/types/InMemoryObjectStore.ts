import type { PR } from 'freedom-async';
import { bestEffort, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ConflictError, InternalSchemaValidationError, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import type { IndexStore } from 'freedom-indexing-types';
import { InMemoryIndexStore } from 'freedom-indexing-types';
import type { PageToken, Paginated } from 'freedom-paginated-data';
import type { Schema } from 'yaschema';

import type { MutableObjectAccessor } from './MutableObjectAccessor.ts';
import type { MutableObjectStore } from './MutableObjectStore.ts';
import type { ObjectAccessor } from './ObjectAccessor.ts';
import type { ObjectStoreManagement } from './ObjectStoreManagement.ts';
import type { StorableObject } from './StorableObject.ts';

export type InMemoryObjectStoreConstructorArgs<KeyT extends string, T> = {
  schema: Schema<T>;
  _keyType?: KeyT;
};

export class InMemoryObjectStore<KeyT extends string, T> implements MutableObjectStore<KeyT, T>, ObjectStoreManagement<KeyT, T> {
  public readonly uid = makeUuid();

  private readonly keys_ = new InMemoryIndexStore<KeyT, unknown>({ config: { type: 'key' } });
  public readonly keys = this.keys_ as IndexStore<KeyT, unknown>;

  private readonly schema_: Schema<T>;
  private readonly deletedKeys_ = new Set<KeyT>();
  private readonly storage_ = new Map<KeyT, StorableObject<T>>();

  constructor({ schema }: InMemoryObjectStoreConstructorArgs<KeyT, T>) {
    this.schema_ = schema;
  }

  // MutableObjectStore Methods

  public mutableObject(key: KeyT): MutableObjectAccessor<T> {
    const readonlyValues = this.object(key);

    const create = makeAsyncResultFunc(
      [import.meta.filename, 'mutableObject', 'create'],
      async (trace: Trace, initialValue: T): PR<T, 'conflict'> => {
        if (this.storage_.has(key)) {
          return makeFailure(new ConflictError(trace, { message: `${key} already exists`, errorCode: 'conflict' }));
        } else if (this.deletedKeys_.has(key)) {
          return makeFailure(new ConflictError(trace, { message: `${key} was deleted`, errorCode: 'conflict' }));
        }

        const cloned = await this.cloneValue_(trace, initialValue);
        /* node:coverage disable */
        if (!cloned.ok) {
          return cloned;
        }
        /* node:coverage enable */

        cloned.value.updateCount = 0;

        const initialStoredValue: StorableObject<T> = cloned.value;

        this.storage_.set(key, initialStoredValue);

        // Updating indices
        await bestEffort(trace, this.addToIndices_(trace, key, initialStoredValue));

        return makeSuccess(initialStoredValue.storedValue);
      }
    );

    const getMutable = makeAsyncResultFunc(
      [import.meta.filename, 'mutableObject', 'getMutable'],
      async (trace): PR<StorableObject<T>, 'not-found'> => {
        /* node:coverage disable */
        if (this.deletedKeys_.has(key)) {
          return makeFailure(
            new NotFoundError(trace, { message: `No object found for key: ${key} (was deleted)`, errorCode: 'not-found' })
          );
        }
        /* node:coverage enable */

        const found = await this.get_(trace, key);
        /* node:coverage disable */
        if (!found.ok) {
          return found;
        }
        /* node:coverage enable */

        return makeSuccess(found.value);
      }
    );

    return {
      ...readonlyValues,

      create,

      delete: makeAsyncResultFunc([import.meta.filename, 'mutableObject', 'delete'], async (trace): PR<undefined, 'not-found'> => {
        const found = this.storage_.get(key);
        /* node:coverage disable */
        if (found === undefined) {
          return makeFailure(new NotFoundError(trace, { message: `No object found for key: ${key}`, errorCode: 'not-found' }));
        }
        /* node:coverage enable */

        this.deletedKeys_.add(key);

        // Updating indices
        await bestEffort(trace, this.removeFromIndices_(trace, key));

        return makeSuccess(undefined);
      }),

      getMutable,

      update: makeAsyncResultFunc(
        [import.meta.filename, 'mutableObject', 'update'],
        async (trace, newValue: StorableObject<T>): PR<undefined, 'not-found' | 'out-of-date'> => {
          const found = this.storage_.get(key);
          /* node:coverage disable */
          if (found === undefined) {
            return makeFailure(new NotFoundError(trace, { message: `No object found for key: ${key}`, errorCode: 'not-found' }));
          } else if (this.deletedKeys_.has(key)) {
            return makeFailure(
              new NotFoundError(trace, { message: `No object found for key: ${key} (was deleted)`, errorCode: 'not-found' })
            );
          }
          /* node:coverage enable */

          if (newValue.updateCount !== found.updateCount) {
            return makeFailure(
              new ConflictError(trace, {
                message: `Expected updateCount: ${found.updateCount}, found: ${newValue.updateCount}`,
                errorCode: 'out-of-date'
              })
            );
          }

          const cloned = await this.cloneValue_(trace, newValue.storedValue);
          /* node:coverage disable */
          if (!cloned.ok) {
            return cloned;
          }
          /* node:coverage enable */

          cloned.value.updateCount = newValue.updateCount + 1;

          const newStoredValue: StorableObject<T> = cloned.value;

          this.storage_.set(key, newStoredValue);

          // Updating indices
          await bestEffort(trace, this.addToIndices_(trace, key, newStoredValue));

          return makeSuccess(undefined);
        }
      )
    };
  }

  // ObjectStore Methods

  public object(key: KeyT): ObjectAccessor<T> {
    return {
      exists: makeAsyncResultFunc(
        [import.meta.filename, 'object', 'exists'],
        async (_trace): PR<boolean> => makeSuccess(this.storage_.has(key) && !this.deletedKeys_.has(key))
      ),

      get: makeAsyncResultFunc([import.meta.filename, 'object', 'get'], async (trace): PR<T, 'not-found'> => {
        /* node:coverage disable */
        if (this.deletedKeys_.has(key)) {
          return makeFailure(
            new NotFoundError(trace, { message: `No object found for key: ${key} (was deleted)`, errorCode: 'not-found' })
          );
        }
        /* node:coverage enable */

        const found = await this.get_(trace, key);
        /* node:coverage disable */
        if (!found.ok) {
          return found;
        }
        /* node:coverage enable */

        return makeSuccess(found.value.storedValue);
      })
    };
  }

  public async getMultiple(_trace: Trace, keys: KeyT[]): PR<{ found: Partial<Record<KeyT, T>>; notFound: KeyT[] }> {
    const found: Partial<Record<KeyT, T>> = {};
    const notFound: KeyT[] = [];

    for (const key of keys) {
      const foundRecord = this.storage_.get(key);
      if (foundRecord === undefined || this.deletedKeys_.has(key)) {
        notFound.push(key);
      } else {
        found[key] = foundRecord.storedValue;
      }
    }

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

      return makeSuccess({ items: Array.from(this.deletedKeys_), estCount: this.deletedKeys_.size });
    }
  );

  public readonly sweep = makeAsyncResultFunc([import.meta.filename, 'sweep'], async (trace: Trace): PR<KeyT[]> => {
    const deletedKeys = await this.getDeletedKeys(trace);
    /* node:coverage disable */
    if (!deletedKeys.ok) {
      return deletedKeys;
    }
    /* node:coverage enable */

    for (const key of deletedKeys.value.items) {
      this.deletedKeys_.delete(key);
      this.storage_.delete(key);
    }

    return makeSuccess(deletedKeys.value.items);
  });

  // Private Methods

  private readonly addToIndices_ = makeAsyncResultFunc(
    [import.meta.filename, 'addToIndices_'],
    async (trace, key: KeyT, _stored: StorableObject<T>) => await this.keys_.addToIndex(trace, key, undefined)
  );

  private readonly get_ = makeAsyncResultFunc(
    [import.meta.filename, 'get_'],
    async (trace, key: KeyT): PR<StorableObject<T>, 'not-found'> => {
      const found = this.storage_.get(key);
      /* node:coverage disable */
      if (found === undefined) {
        return makeFailure(new NotFoundError(trace, { message: `No object found for key: ${key}`, errorCode: 'not-found' }));
      } else if (this.deletedKeys_.has(key)) {
        return makeFailure(new NotFoundError(trace, { message: `No object found for key: ${key} (was deleted)`, errorCode: 'not-found' }));
      }
      /* node:coverage enable */

      const cloned = await this.cloneValue_(trace, found.storedValue);
      /* node:coverage disable */
      if (!cloned.ok) {
        return cloned;
      }
      /* node:coverage enable */

      cloned.value.updateCount = found.updateCount;

      return makeSuccess(cloned.value);
    }
  );

  private readonly removeFromIndices_ = makeAsyncResultFunc(
    [import.meta.filename, 'removeFromIndices_'],
    async (trace, key: KeyT) => await this.keys_.removeFromIndex(trace, key)
  );

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
