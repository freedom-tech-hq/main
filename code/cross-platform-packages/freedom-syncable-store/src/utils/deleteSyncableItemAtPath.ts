import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';
import { folderLikeSyncableItemTypes } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { getMutableParentSyncable } from './get/getMutableParentSyncable.ts';

export const deleteSyncableItemAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: MutableSyncableStore, path: SyncablePath): PR<undefined, 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parentFileStore = await getMutableParentSyncable(trace, store, path, folderLikeSyncableItemTypes);
    if (!parentFileStore.ok) {
      return parentFileStore;
    }

    return await parentFileStore.value.delete(trace, path.lastId!);
  }
);
