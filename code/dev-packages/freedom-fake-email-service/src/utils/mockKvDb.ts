import fs from 'node:fs/promises';
import path from 'node:path';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ConflictError, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { Schema, schema } from 'yaschema';

import { getAllStorageRootPath } from './getAllStorageRootPath.ts';

interface KvStore {
  [key: string]: any;
}

let dbFilePath: string | undefined = undefined;

async function requireConnection(trace: Trace) {
  if (dbFilePath) {
    return;
  }

  const storageRootPath = await getAllStorageRootPath(trace);
  if (!storageRootPath.ok) {
    throw new Error(`Failed to get storage root path: ${storageRootPath.value.message}`);
  }

  dbFilePath = path.join(storageRootPath.value, 'mock-kv-db.json');

  // Ensure the DB file exists
  try {
    await fs.access(dbFilePath);
  } catch {
    // File doesn't exist, create it with empty object
    await fs.writeFile(dbFilePath, JSON.stringify({}, null, 2));
  }
}

const readDb = async (): Promise<KvStore> => {
  if (!dbFilePath) {
    throw new Error('Database not connected');
  }
  const data = await fs.readFile(dbFilePath, 'utf-8');
  return JSON.parse(data);
};

const writeDb = async (store: KvStore): Promise<void> => {
  if (!dbFilePath) {
    throw new Error('Database not connected');
  }
  await fs.writeFile(dbFilePath, JSON.stringify(store, null, 2));
};

export const kvSetValue = makeAsyncResultFunc(
  [import.meta.filename, 'kvSetValue'],
  async <T>(trace: Trace, key: string, schema: Schema<T>, value: T): PR<T, 'conflict'> => {
    await requireConnection(trace);

    const store = await readDb();

    if (store[key] !== undefined) {
      return makeFailure(new ConflictError(trace, { message: `Key already exists: ${key}`, errorCode: 'conflict' }));
    }

    const serialized = await schema.serializeAsync(value);
    if (!serialized.serialized || serialized.error) {
      return makeFailure(new GeneralError(trace, new Error(`Serialization is broken '${serialized.error}'`)));
    }

    store[key] = serialized.serialized;
    await writeDb(store);

    return makeSuccess(value);
  }
);

export const kvGetValue = makeAsyncResultFunc(
  [import.meta.filename, 'kvGetValue'],
  async <T>(trace: Trace, key: string, schema: schema.CustomSchema<T, any> | Schema<T>): PR<T, 'not-found'> => {
    await requireConnection(trace);

    const store = await readDb();
    const rawValue = store[key];

    if (rawValue === undefined) {
      return makeFailure(new NotFoundError(trace, { message: `Key not found: ${key}`, errorCode: 'not-found' }));
    }

    const result = await schema.deserializeAsync(rawValue);
    if (!result.deserialized || result.error) {
      return makeFailure(new GeneralError(trace, new Error(`Deserialization error: ${result.error}`)));
    }
    return makeSuccess(result.deserialized);
  }
);
