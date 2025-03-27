import { makeSuccess, makeSyncFunc } from 'freedom-async';

import type { SyncableStoreBackingFileAccessor } from '../../../backing/accessors/SyncableStoreBackingFileAccessor.ts';
import type { InMemorySyncableStoreBackingFileItem } from '../types/InMemorySyncableStoreBackingFileItem.ts';

export const makeFileAccessor = makeSyncFunc(
  [import.meta.filename],
  (_trace, item: InMemorySyncableStoreBackingFileItem): SyncableStoreBackingFileAccessor => {
    const data = item.data;
    return {
      type: 'file',
      id: item.id,
      getBinary: async () => makeSuccess(data)
    };
  }
);
