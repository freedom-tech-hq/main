import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ConflictError, generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableFolderAccessor, MutableSyncableStore } from 'freedom-syncable-store-types';

import { getMutableParentSyncable } from '../../../utils/get/getMutableParentSyncable.ts';
import { disableSyncableValidation } from '../../context/isSyncableValidationEnabled.ts';

// TODO: reenable validation in a smarter way
export const createViaSyncFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  disableSyncableValidation(
    async (
      trace,
      store: MutableSyncableStore,
      path: SyncablePath,
      metadata: SyncableItemMetadata
    ): PR<MutableSyncableFolderAccessor, 'conflict' | 'not-found' | 'untrusted' | 'wrong-type'> => {
      if (path.ids.length === 0) {
        // Root will always already exist
        return makeFailure(new ConflictError(trace, { errorCode: 'conflict' }));
      }

      const parent = await getMutableParentSyncable(trace, store, path, 'folder');
      if (!parent.ok) {
        return parent;
      }

      const created = await parent.value.createFolder(trace, { mode: 'via-sync', id: path.lastId!, metadata });
      if (!created.ok) {
        // 'deleted' should never happen here because createFolder with 'via-sync' doesn't check for deletion
        return generalizeFailureResult(trace, created, 'deleted');
      }

      return makeSuccess(created.value);
    }
  )
);
