import { makeSuccess, makeSyncFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableStoreBackingFileAccessor } from 'freedom-syncable-store-types';

import type { OpfsSyncableStoreBackingFileItem } from '../types/OpfsSyncableStoreBackingFileItem.ts';

export const makeFileAccessor = makeSyncFunc(
  [import.meta.filename],
  (_trace, item: OpfsSyncableStoreBackingFileItem): SyncableStoreBackingFileAccessor => {
    return {
      type: 'file',
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
