import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemMetadata } from 'freedom-sync-types';
import { folderLikeSyncableItemTypes, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { ACCESS_CONTROL_BUNDLE_ID } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import { lastIndexOf } from 'lodash-es';

import { disableSyncableValidation } from '../../context/isSyncableValidationEnabled.ts';
import { getMutableParentSyncable } from '../get/getMutableParentSyncable.ts';

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
    ): PR<undefined, 'not-found' | 'untrusted' | 'wrong-type'> => {
      // Any time any part of an access control bundle is changed, clear trust for the associated folder
      const accessControlBundleIdIndex = lastIndexOf(path.ids, ACCESS_CONTROL_BUNDLE_ID);
      if (accessControlBundleIdIndex >= 0) {
        const folderPath = new SyncablePath(path.storageRootId, ...path.ids.slice(0, accessControlBundleIdIndex));
        store.localTrustMarks.clearTrust(folderPath);
      }

      const parent = await getMutableParentSyncable(trace, store, path, folderLikeSyncableItemTypes);
      if (!parent.ok) {
        return parent;
      }

      const created = await disableLam('conflict', parent.value.createBinaryFile)(trace, {
        mode: 'via-sync',
        id: path.lastId!,
        encodedValue,
        metadata
      });
      if (!created.ok) {
        if (created.value.errorCode === 'conflict') {
          // If there's a conflict, we can ignore it because the file already exists
          return makeSuccess(undefined);
        }

        // 'deleted' should never happen here because createBinaryFile with 'via-sync' doesn't check for deletion
        return generalizeFailureResult(trace, excludeFailureResult(created, 'conflict'), 'deleted');
      }

      return makeSuccess(undefined);
    }
  )
);
