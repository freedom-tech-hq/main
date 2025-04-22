import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableFolderAccessor, MutableSyncableStore } from 'freedom-syncable-store-types';

import { getMutableParentSyncable } from '../get/getMutableParentSyncable.ts';

export const createViaSyncFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    metadata: SyncableItemMetadata
  ): PR<MutableSyncableFolderAccessor, 'deleted' | 'conflict' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    if (path.ids.length === 0) {
      // Root will always already exist
      return makeFailure(new ConflictError(trace, { errorCode: 'conflict' }));
    }

    const parent = await getMutableParentSyncable(trace, store, path, 'folder');
    if (!parent.ok) {
      return parent;
    }

    return await parent.value.createFolder(trace, { mode: 'via-sync', id: path.lastId!, metadata });
  }
);
