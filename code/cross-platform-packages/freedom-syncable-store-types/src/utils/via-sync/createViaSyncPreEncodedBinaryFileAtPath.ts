import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncableFileMetadata } from 'freedom-sync-types';
import { syncableItemTypes, SyncablePath } from 'freedom-sync-types';
import { lastIndexOf } from 'lodash-es';

import { ACCESS_CONTROL_BUNDLE_ID } from '../../consts/special-file-ids.ts';
import type { MutableSyncableFileAccessor } from '../../types/MutableSyncableFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableParentSyncable } from '../get/getMutableParentSyncable.ts';

export const createViaSyncPreEncodedBinaryFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    encodedValue: Uint8Array,
    metadata: SyncableFileMetadata
  ): PR<MutableSyncableFileAccessor, 'deleted' | 'conflict' | 'not-found' | 'untrusted' | 'wrong-type'> => {
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
);
