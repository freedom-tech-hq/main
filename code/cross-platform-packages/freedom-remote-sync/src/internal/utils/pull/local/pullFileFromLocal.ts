import { allResultsNamed, makeAsyncResultFunc, type PR } from 'freedom-async';
import type { PushFile, SyncablePath } from 'freedom-sync-types';
import { getSyncableAtPath } from 'freedom-syncable-store';
import type { SyncableStore } from 'freedom-syncable-store-types';

export const pullFileFromLocal = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: SyncablePath): PR<PushFile, 'not-found' | 'untrusted' | 'wrong-type'> => {
    const file = await getSyncableAtPath(trace, store, path, 'file');
    if (!file.ok) {
      return file;
    }

    return await allResultsNamed(
      trace,
      {},
      {
        data: file.value.getEncodedBinary(trace),
        metadata: file.value.getMetadata(trace)
      }
    );
  }
);
