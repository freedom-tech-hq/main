import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemMetadata } from 'freedom-sync-types';
import { syncableItemTypes, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableFileAccessor, MutableSyncableStore } from 'freedom-syncable-store-types';
import { ACCESS_CONTROL_BUNDLE_ID } from 'freedom-syncable-store-types';
import { lastIndexOf } from 'lodash-es';

import { getMutableParentSyncable } from '../../../utils/get/getMutableParentSyncable.ts';
import { disableSyncableValidation } from '../../context/isSyncableValidationEnabled.ts';

// TODO: reenable validation in a smarter way
export const createViaSyncPreEncodedBinaryFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  disableSyncableValidation(
    async (
      trace: Trace,
      store: MutableSyncableStore,
      path: SyncablePath,
      encodedValue: Uint8Array,
      metadata: SyncableItemMetadata
    ): PR<MutableSyncableFileAccessor, 'conflict' | 'not-found' | 'untrusted' | 'wrong-type'> => {
      // Any time any part of an access control bundle is changed, clear trust for the associated folder
      const accessControlBundleIdIndex = lastIndexOf(path.ids, ACCESS_CONTROL_BUNDLE_ID);
      if (accessControlBundleIdIndex >= 0) {
        const folderPath = new SyncablePath(path.storageRootId, ...path.ids.slice(0, accessControlBundleIdIndex));
        store.localTrustMarks.clearTrust(folderPath);
      }

      const parent = await getMutableParentSyncable(trace, store, path, syncableItemTypes.exclude('file'));
      if (!parent.ok) {
        return parent;
      }

      const created = await parent.value.createBinaryFile(trace, { mode: 'via-sync', id: path.lastId!, encodedValue, metadata });
      if (!created.ok) {
        // 'deleted' should never happen here because createBinaryFile with 'via-sync' doesn't check for deletion
        return generalizeFailureResult(trace, created, 'deleted');
      }

      return makeSuccess(created.value);
    }
  )
);
