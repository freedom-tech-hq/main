import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { IndexedDbObjectStore } from 'freedom-indexeddb-object-store';
import { once } from 'lodash-es';

import type { LocallyStoredCredentialId } from '../../types/id/LocallyStoredCredentialId.ts';
import type { StoredEmailCredential } from '../types/StoredEmailCredential.ts';
import { storedEmailCredentialSchema } from '../types/StoredEmailCredential.ts';
import { getIndexedDbForEmailCredentialObjectStore } from './getIndexedDbForEmailCredentialObjectStore.ts';

export const getEmailCredentialObjectStore = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (trace): PR<IndexedDbObjectStore<LocallyStoredCredentialId, StoredEmailCredential>> => {
    const db = await getIndexedDbForEmailCredentialObjectStore(trace);
    if (!db.ok) {
      return db;
    }

    return makeSuccess(
      new IndexedDbObjectStore<LocallyStoredCredentialId, StoredEmailCredential>({
        db: db.value,
        storeName: 'kv',
        schema: storedEmailCredentialSchema
      })
    );
  })
);
