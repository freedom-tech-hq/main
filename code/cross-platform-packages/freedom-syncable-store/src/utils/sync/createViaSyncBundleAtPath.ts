import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { folderLikeSyncableItemTypes, type SyncableItemMetadata, type SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { disableSyncableValidation } from '../../context/isSyncableValidationEnabled.ts';
import { getMutableParentSyncable } from '../get/getMutableParentSyncable.ts';

// TODO: reenable validation in a smarter way
export const createViaSyncBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  disableSyncableValidation(
    async (
      trace,
      store: MutableSyncableStore,
      path: SyncablePath,
      metadata: SyncableItemMetadata
    ): PR<undefined, 'not-found' | 'untrusted' | 'wrong-type'> => {
      const parent = await getMutableParentSyncable(trace, store, path, folderLikeSyncableItemTypes);
      if (!parent.ok) {
        return parent;
      }

      const created = await disableLam('conflict', parent.value.createBundle)(trace, { mode: 'via-sync', id: path.lastId!, metadata });
      if (!created.ok) {
        if (created.value.errorCode === 'conflict') {
          // If there's a conflict, we can ignore it because the bundle already exists
          return makeSuccess(undefined);
        }

        // 'deleted' should never happen here because createBundle with 'via-sync' doesn't check for deletion
        return generalizeFailureResult(trace, excludeFailureResult(created, 'conflict'), 'deleted');
      }

      return makeSuccess(undefined);
    }
  )
);
