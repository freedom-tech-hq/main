import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { getSyncableAtPath } from './get/getSyncableAtPath.ts';

export const getSyncableHashAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: SyncablePath): PR<Sha256Hash, 'not-found' | 'untrusted' | 'wrong-type'> => {
    const itemAccessor = await getSyncableAtPath(trace, store, path);
    if (!itemAccessor.ok) {
      return itemAccessor;
    }

    return await itemAccessor.value.getHash(trace);
  }
);
