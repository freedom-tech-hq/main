import path from 'node:path';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type PrivateCombinationCryptoKeySet, privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { JsonFileObjectStore } from 'freedom-json-file-object-store';
import type { MutableObjectStore } from 'freedom-object-store-types';
import { once } from 'lodash-es';

import { getConfig } from '../../../config.ts';

export const getPrivateKeyStore = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (_trace): PR<MutableObjectStore<string, PrivateCombinationCryptoKeySet>> => {
    const storageRootPath = getConfig('allStorageRootPath');

    const jsonPath = path.join(storageRootPath, 'mock-kv-db.json');

    return makeSuccess(new JsonFileObjectStore({ path: jsonPath, schema: privateCombinationCryptoKeySetSchema }));
  })
);
