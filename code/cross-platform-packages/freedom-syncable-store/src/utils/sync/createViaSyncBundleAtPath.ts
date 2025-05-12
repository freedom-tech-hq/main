import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import { syncableItemTypes } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { disableSyncableValidation } from '../../internal/context/isSyncableValidationEnabled.ts';
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
      const parent = await getMutableParentSyncable(trace, store, path, syncableItemTypes.exclude('file'));
      if (!parent.ok) {
        return parent;
      }

      const created = await parent.value.createBundle(trace, { mode: 'via-sync', id: path.lastId!, metadata });
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
