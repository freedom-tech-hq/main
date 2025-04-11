import type { PR } from 'freedom-async';
import { computeAsyncOnce, GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';

const secretKey = makeUuid();

// TODO: get rid of these and use ObjectStore
export const getKvDb = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace, { dbName, dbVersion, storeName }: { dbName: string; dbVersion: number; storeName: string }): PR<IDBDatabase> =>
    await computeAsyncOnce(
      [import.meta.filename],
      `${secretKey}.${dbName}.${dbVersion}.${storeName}`,
      async (trace) =>
        await new Promise((resolve) => {
          const request = indexedDB.open(dbName, dbVersion);

          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName);
            }
          };

          request.onsuccess = () => resolve(makeSuccess(request.result));
          request.onerror = () => resolve(makeFailure(new GeneralError(trace, request.error)));
        })
    )
);
