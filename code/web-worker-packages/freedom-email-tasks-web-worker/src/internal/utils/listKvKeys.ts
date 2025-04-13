import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';

import { getKvDb } from './getKvDb.ts';

export const listKvKeys = makeAsyncResultFunc([import.meta.filename], async (trace): PR<string[]> => {
  const db = await getKvDb(trace, { dbName: 'kvstore', dbVersion: 1, storeName: 'kvstore' });
  if (!db.ok) {
    return db;
  }

  return await new Promise((resolve) => {
    const tx = db.value.transaction('kvstore', 'readonly');
    const store = tx.objectStore('kvstore');
    const request = store.getAllKeys();

    request.onsuccess = () => resolve(makeSuccess(request.result as string[]));
    request.onerror = () => resolve(makeFailure(new GeneralError(trace, request.error)));
  });
});
