import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { getSyncableAtPath } from '../../utils/get/getSyncableAtPath.ts';
import { disableSyncableValidation } from '../context/isSyncableValidationEnabled.ts';

export const markSyncableNeedsRecomputeLocalMetadataAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: SyncablePath): PR<undefined, 'not-found' | 'untrusted' | 'wrong-type'> => {
    // Disabling validation since we're creating something new -- and this might be a new access control bundle for example, which would
    // make checking it impossible anyway
    const itemAccessor = await disableSyncableValidation(getSyncableAtPath)(trace, store, path);
    if (!itemAccessor.ok) {
      return itemAccessor;
    }

    return await itemAccessor.value.markNeedsRecomputeLocalMetadata(trace);
  }
);
