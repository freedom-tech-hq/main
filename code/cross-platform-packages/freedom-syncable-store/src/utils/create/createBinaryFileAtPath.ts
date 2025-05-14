import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { DynamicSyncableItemName, SyncableOriginOptions, SyncablePath } from 'freedom-sync-types';
import { folderLikeSyncableItemTypes } from 'freedom-sync-types';
import type { MutableSyncableFileAccessor, MutableSyncableStore } from 'freedom-syncable-store-types';

import { disableSyncableValidation } from '../../context/isSyncableValidationEnabled.ts';
import { getMutableSyncableAtPath } from '../get/getMutableSyncableAtPath.ts';

export const createBinaryFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    { name, value, trustedTimeSignature }: Partial<SyncableOriginOptions> & { name?: DynamicSyncableItemName; value: Uint8Array }
  ): PR<MutableSyncableFileAccessor, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    // Disabling validation since we're creating something new -- and this might be a new access control bundle for example, which would
    // make checking it impossible anyway
    const parent = await disableSyncableValidation(getMutableSyncableAtPath)(trace, store, path.parentPath!, folderLikeSyncableItemTypes);
    if (!parent.ok) {
      return parent;
    }

    return await parent.value.createBinaryFile(trace, { id: path.lastId!, name, value, trustedTimeSignature });
  }
);
