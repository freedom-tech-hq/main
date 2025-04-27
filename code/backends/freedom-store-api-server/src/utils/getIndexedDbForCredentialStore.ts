import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { getIndexedDb } from 'freedom-indexeddb-object-store';
import { once } from 'lodash-es';

export const getIndexedDbForCredentialStore = makeAsyncResultFunc(
  [import.meta.filename],
  once(async (trace): PR<IDBDatabase> => {
    return getIndexedDb(trace, {
      name: 'freedom-credentials',
      version: 1,
      upgradeDb: (db) => {
        if (!db.objectStoreNames.contains('credentials')) {
          db.createObjectStore('credentials');
        }
      }
    });
  })
);