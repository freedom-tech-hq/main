import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

export const writeKv = makeAsyncResultFunc(
  [import.meta.filename],
  async <KeyT extends string, T>(
    trace: Trace,
    db: IDBDatabase,
    { storeName, key, value }: { storeName: string; key: KeyT; value: T }
  ): PR<undefined> =>
    await new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve(makeSuccess(undefined));
      request.onerror = () => resolve(makeFailure(new GeneralError(trace, request.error)));
    })
);
