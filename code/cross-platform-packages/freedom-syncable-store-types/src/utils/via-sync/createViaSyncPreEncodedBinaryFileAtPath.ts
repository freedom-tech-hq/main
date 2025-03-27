import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncableFlatFileMetadata } from 'freedom-sync-types';
import { StaticSyncablePath, syncableItemTypes } from 'freedom-sync-types';
import { lastIndexOf } from 'lodash-es';

import { ACCESS_CONTROL_BUNDLE_ID } from '../../consts/special-file-ids.ts';
import type { MutableSyncableFlatFileAccessor } from '../../types/MutableSyncableFlatFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableParentSyncable } from '../get/getMutableParentSyncable.ts';

export const createViaSyncPreEncodedBinaryFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: MutableSyncableStore,
    path: StaticSyncablePath,
    encodedValue: Uint8Array,
    metadata: SyncableFlatFileMetadata
  ): PR<MutableSyncableFlatFileAccessor, 'deleted' | 'conflict' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    // Any time any part of an access control bundle is changed, clear trust for the associated folder
    const accessControlBundleIdIndex = lastIndexOf(path.ids, ACCESS_CONTROL_BUNDLE_ID);
    if (accessControlBundleIdIndex >= 0) {
      const folderPath = new StaticSyncablePath(path.storageRootId, ...path.ids.slice(0, accessControlBundleIdIndex));
      store.localTrustMarks.clearTrust(folderPath);
    }

    const parent = await getMutableParentSyncable(trace, store, path, syncableItemTypes.exclude('flatFile'));
    if (!parent.ok) {
      return parent;
    }

    return await parent.value.createBinaryFile(trace, { mode: 'via-sync', id: path.lastId!, encodedValue, metadata });
  }
);
