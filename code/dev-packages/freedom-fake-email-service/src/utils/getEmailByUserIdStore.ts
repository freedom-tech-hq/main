import path from 'node:path';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-sync';
import { JsonFileObjectStore } from 'freedom-json-file-object-store';
import { type MutableObjectStore } from 'freedom-object-store-types';
import { once } from 'lodash-es';
import { schema } from 'yaschema';

import { getAllStorageRootPath } from './getAllStorageRootPath.ts';

export const getEmailByUserIdStore = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (trace): PR<MutableObjectStore<EmailUserId, string>> => {
    const storageRootPath = await uncheckedResult(getAllStorageRootPath(trace));

    const jsonPath = path.join(storageRootPath, 'mock-email-by-user-id-db.json');

    return makeSuccess(new JsonFileObjectStore({ path: jsonPath, schema: schema.string() }));
  })
);
