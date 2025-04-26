import path from 'node:path';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { CombinationCryptoKeySet, CryptoKeySetId } from 'freedom-crypto-data';
import { combinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { JsonFileObjectStore } from 'freedom-json-file-object-store';
import type { MutableObjectStore } from 'freedom-object-store-types';
import { once } from 'lodash-es';

import { getConfig } from '../../../config.ts';

export const getPublicKeyStore = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (_trace): PR<MutableObjectStore<CryptoKeySetId, CombinationCryptoKeySet>> => {
    const storageRootPath = getConfig('allStorageRootPath');

    const jsonPath = path.join(storageRootPath, 'mock-user-public-keys-db.json');

    return makeSuccess(new JsonFileObjectStore({ path: jsonPath, schema: combinationCryptoKeySetSchema }));
  })
);
