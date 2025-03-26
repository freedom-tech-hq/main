import { makeSuccess, makeSyncFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableStoreBackingFlatFileAccessor } from 'freedom-syncable-store-types';

import type { FileSystemSyncableStoreBackingFlatFileItem } from '../types/FileSystemSyncableStoreBackingFlatFileItem.ts';

export const makeFlatFileAccessor = makeSyncFunc(
  [import.meta.filename],
  (_trace, item: FileSystemSyncableStoreBackingFlatFileItem): SyncableStoreBackingFlatFileAccessor => {
    return {
      type: 'flatFile',
      id: item.id,
      getBinary: async (trace) => {
        const loaded = await item.data(trace);
        if (!loaded.ok) {
          return generalizeFailureResult(trace, loaded, ['not-found', 'wrong-type']);
        }

        return makeSuccess(loaded.value);
      }
    };
  }
);
