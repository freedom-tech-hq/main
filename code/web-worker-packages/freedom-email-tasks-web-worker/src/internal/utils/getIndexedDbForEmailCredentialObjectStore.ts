import { makeAsyncResultFunc } from 'freedom-async';
import { getIndexedDb } from 'freedom-indexeddb-object-store';

export const getIndexedDbForEmailCredentialObjectStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace) => await getIndexedDb(trace, { dbName: 'emailCredential', dbVersion: 1, storeName: 'kv' })
);
