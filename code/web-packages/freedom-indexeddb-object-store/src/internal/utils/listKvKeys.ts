import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

export const listKvKeys = makeAsyncResultFunc(
  [import.meta.filename],
  async <KeyT extends string>(trace: Trace, db: IDBDatabase, storeName: string): PR<KeyT[]> => {
    return await new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(makeSuccess(request.result as KeyT[]));
      request.onerror = () => resolve(makeFailure(new GeneralError(trace, request.error)));
    });
  }
);
