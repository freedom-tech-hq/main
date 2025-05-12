import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { disableSyncableValidation } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getMutableParentSyncable } from '../get/getMutableParentSyncable.ts';

// TODO: reenable validation in a smarter way
export const createViaSyncFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  disableSyncableValidation(
    async (
      trace,
      store: MutableSyncableStore,
      path: SyncablePath,
      metadata: SyncableItemMetadata
    ): PR<undefined, 'not-found' | 'untrusted' | 'wrong-type'> => {
      if (path.ids.length === 0) {
        // Root will always already exist
        return makeSuccess(undefined);
      }

      const parent = await getMutableParentSyncable(trace, store, path, 'folder');
      if (!parent.ok) {
        return parent;
      }

      const created = await parent.value.createFolder(trace, { mode: 'via-sync', id: path.lastId!, metadata });
      if (!created.ok) {
        if (created.value.errorCode === 'conflict') {
          // If there's a conflict, we can ignore it because the folder already exists
          return makeSuccess(undefined);
        }

        // 'deleted' should never happen here because createFolder with 'via-sync' doesn't check for deletion
        return generalizeFailureResult(trace, excludeFailureResult(created, 'conflict'), 'deleted');
      }

      return makeSuccess(undefined);
    }
  )
);
