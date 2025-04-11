import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';

import { getKvDb } from './getKvDb.ts';

export const writeKv = makeAsyncResultFunc([import.meta.filename], async (trace, key: string, value: string): PR<undefined> => {
  const db = await getKvDb(trace, { dbName: 'kvstore', dbVersion: 1, storeName: 'kvstore' });
  if (!db.ok) {
    return db;
  }

  return await new Promise((resolve) => {
    const tx = db.value.transaction('kvstore', 'readwrite');
    const store = tx.objectStore('kvstore');
    const request = store.put(value, key);

    request.onsuccess = () => resolve(makeSuccess(undefined));
    request.onerror = () => resolve(makeFailure(new GeneralError(trace, request.error)));
  });
});
