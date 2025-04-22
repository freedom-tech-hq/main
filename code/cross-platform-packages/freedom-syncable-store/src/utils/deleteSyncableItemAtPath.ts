import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';
import { syncableItemTypes } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { getMutableParentSyncable } from './get/getMutableParentSyncable.ts';

export const deleteSyncableItemAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: MutableSyncableStore, path: SyncablePath): PR<undefined, 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parentFileStore = await getMutableParentSyncable(trace, store, path, syncableItemTypes.exclude('file'));
    if (!parentFileStore.ok) {
      if (parentFileStore.value.errorCode === 'deleted') {
        // Parent already deleted
        return makeSuccess(undefined);
      }
      return excludeFailureResult(parentFileStore, 'deleted');
    }

    return await parentFileStore.value.delete(trace, path.lastId!);
  }
);
