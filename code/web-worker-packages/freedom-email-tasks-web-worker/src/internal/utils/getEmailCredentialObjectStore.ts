import type { PR } from 'freedom-async';
import { computeAsyncOnce, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { IndexedDbObjectStore } from 'freedom-indexeddb-object-store';

import type { StoredEmailCredential } from '../types/StoredEmailCredential.ts';
import { storedEmailCredentialSchema } from '../types/StoredEmailCredential.ts';
import { getIndexedDbForEmailCredentialObjectStore } from './getIndexedDbForEmailCredentialObjectStore.ts';

const secretKey = makeUuid();

export const getEmailCredentialObjectStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace) =>
    await computeAsyncOnce([import.meta.filename], secretKey, async (trace): PR<IndexedDbObjectStore<Uuid, StoredEmailCredential>> => {
      const db = await getIndexedDbForEmailCredentialObjectStore(trace);
      if (!db.ok) {
        return db;
      }

      return makeSuccess(
        new IndexedDbObjectStore<Uuid, StoredEmailCredential>({ db: db.value, storeName: 'kv', schema: storedEmailCredentialSchema })
      );
    })
);
