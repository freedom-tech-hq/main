import path from 'node:path';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { combinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { emailUserIdInfo } from 'freedom-email-sync';
import { JsonFileObjectStore } from 'freedom-json-file-object-store';
import { type MutableObjectStore } from 'freedom-object-store-types';
import { once } from 'lodash-es';
import { schema } from 'yaschema';

import { getAllStorageRootPath } from './getAllStorageRootPath.ts';

const userSchema = schema.object({
  email: schema.string(),
  userId: emailUserIdInfo.schema,
  publicKeys: combinationCryptoKeySetSchema,
  defaultSalt: schema.string()
});
export type User = typeof userSchema.valueType;

export const getUserStore = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (trace): PR<MutableObjectStore<string, User>> => {
    const storageRootPath = await uncheckedResult(getAllStorageRootPath(trace));

    const jsonPath = path.join(storageRootPath, 'mock-db.json');

    return makeSuccess(new JsonFileObjectStore({ path: jsonPath, schema: userSchema }));
  })
);
