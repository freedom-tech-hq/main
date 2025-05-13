import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { LocalItemMetadata, SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { disableSyncableValidation } from '../context/isSyncableValidationEnabled.ts';
import { getSyncableAtPath } from './get/getSyncableAtPath.ts';

export const getMetadataAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    path: SyncablePath
  ): PR<SyncableItemMetadata & LocalItemMetadata, 'not-found' | 'untrusted' | 'wrong-type'> => {
    const itemAccessor = await disableSyncableValidation(getSyncableAtPath)(trace, store, path);
    if (!itemAccessor.ok) {
      return itemAccessor;
    }

    return await itemAccessor.value.getMetadata(trace);
  }
);
