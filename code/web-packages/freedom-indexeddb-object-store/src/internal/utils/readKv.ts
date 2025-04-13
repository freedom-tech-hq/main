import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';

export const readKv = makeAsyncResultFunc(
  [import.meta.filename],
  async <KeyT extends string, T>(trace: Trace, db: IDBDatabase, { storeName, key }: { storeName: string; key: KeyT }): PR<T, 'not-found'> =>
    await new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result === undefined) {
          resolve(makeFailure(new NotFoundError(trace, { message: `No object found for key: ${key}`, errorCode: 'not-found' })));
        } else {
          resolve(makeSuccess(request.result as T));
        }
      };
      request.onerror = () => resolve(makeFailure(new GeneralError(trace, request.error)));
    })
);
