import path from 'node:path';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { JsonFileObjectStore } from 'freedom-json-file-object-store';
import { type MutableObjectStore } from 'freedom-object-store-types';
import { once } from 'lodash-es';

import { getConfig } from '../../../config.ts';
import type { User } from '../../types/User.ts';
import { userSchema } from '../../types/User.ts';

export const getUserStore = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (_trace): PR<MutableObjectStore<string, User>> => {
    const storageRootPath = getConfig('STORAGE_ROOT_PATH');

    const jsonPath = path.join(storageRootPath, 'mock-db.json');

    return makeSuccess(new JsonFileObjectStore({ path: jsonPath, schema: userSchema }));
  })
);
