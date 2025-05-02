import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemMetadata } from 'freedom-sync-types';
import { syncableItemTypes, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableFileAccessor, MutableSyncableStore } from 'freedom-syncable-store-types';
import { ACCESS_CONTROL_BUNDLE_ID } from 'freedom-syncable-store-types';
import { lastIndexOf } from 'lodash-es';

import { isSyncableValidationEnabledProvider } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getMutableParentSyncable } from '../get/getMutableParentSyncable.ts';

export const createViaSyncPreEncodedBinaryFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace: Trace, store: MutableSyncableStore, path: SyncablePath, encodedValue: Uint8Array, metadata: SyncableItemMetadata) =>
    await isSyncableValidationEnabledProvider(
      trace,
      false,
      async (trace): PR<MutableSyncableFileAccessor, 'conflict' | 'not-found' | 'untrusted' | 'wrong-type'> => {
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

        return await parent.value.createBinaryFile(trace, { mode: 'via-sync', id: path.lastId!, encodedValue, metadata });
      }
    )
);
