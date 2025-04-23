import path from 'node:path';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { type PrivateCombinationCryptoKeySet, privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { JsonFileObjectStore } from 'freedom-json-file-object-store';
import type { MutableObjectStore } from 'freedom-object-store-types';
import { once } from 'lodash-es';

import { getAllStorageRootPath } from './getAllStorageRootPath.ts';

export const getPrivateKeyStore = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (trace): PR<MutableObjectStore<string, PrivateCombinationCryptoKeySet>> => {
    const storageRootPath = await uncheckedResult(getAllStorageRootPath(trace));

    const jsonPath = path.join(storageRootPath, 'mock-kv-db.json');

    return makeSuccess(new JsonFileObjectStore({ path: jsonPath, schema: privateCombinationCryptoKeySetSchema }));
  })
);
