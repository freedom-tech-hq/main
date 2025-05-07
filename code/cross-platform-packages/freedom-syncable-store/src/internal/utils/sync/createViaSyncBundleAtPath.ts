import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import { syncableItemTypes } from 'freedom-sync-types';
import type { MutableFileStore, MutableSyncableStore } from 'freedom-syncable-store-types';

import { getMutableParentSyncable } from '../../../utils/get/getMutableParentSyncable.ts';
import { disableSyncableValidation } from '../../context/isSyncableValidationEnabled.ts';

// TODO: reenable validation in a smarter way
export const createViaSyncBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  disableSyncableValidation(
    async (
      trace,
      store: MutableSyncableStore,
      path: SyncablePath,
      metadata: SyncableItemMetadata
    ): PR<MutableFileStore, 'conflict' | 'not-found' | 'untrusted' | 'wrong-type'> => {
      const parent = await getMutableParentSyncable(trace, store, path, syncableItemTypes.exclude('file'));
      if (!parent.ok) {
        return parent;
      }

      const created = await parent.value.createBundle(trace, { mode: 'via-sync', id: path.lastId!, metadata });
      if (!created.ok) {
        // 'deleted' should never happen here because createBundle with 'via-sync' doesn't check for deletion
        return generalizeFailureResult(trace, created, 'deleted');
      }

      return makeSuccess(created.value);
    }
  )
);
