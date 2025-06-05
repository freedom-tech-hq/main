import path from 'node:path';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { EmailUserId } from 'freedom-email-api';
import { JsonFileObjectStore } from 'freedom-json-file-object-store';
import { type MutableObjectStore } from 'freedom-object-store-types';
import { once } from 'lodash-es';
import { schema } from 'yaschema';

import { getConfig } from '../../../config.ts';

export const getEmailByUserIdStore = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (_trace): PR<MutableObjectStore<EmailUserId, string>> => {
    const storageRootPath = getConfig('STORAGE_ROOT_PATH');

    const jsonPath = path.join(storageRootPath, 'mock-email-by-user-id-db.json');

    return makeSuccess(new JsonFileObjectStore({ path: jsonPath, schema: schema.string() }));
  })
);
