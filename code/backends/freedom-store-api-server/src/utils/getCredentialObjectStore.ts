import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { IndexedDbObjectStore } from 'freedom-indexeddb-object-store';
import { once } from 'lodash-es';

import type { ServerStoredCredential } from '../types/ServerStoredCredential.ts';
import { serverStoredCredentialSchema } from '../types/ServerStoredCredential.ts';
import { getIndexedDbForCredentialStore } from './getIndexedDbForCredentialStore.ts';

export const getCredentialObjectStore = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (trace): PR<IndexedDbObjectStore<Uuid, ServerStoredCredential>> => {
    const db = await getIndexedDbForCredentialStore(trace);
    if (!db.ok) {
      return db;
    }

    return makeSuccess(
      new IndexedDbObjectStore<Uuid, ServerStoredCredential>({
        db: db.value,
        storeName: 'credentials',
        schema: serverStoredCredentialSchema
      })
    );
  })
);