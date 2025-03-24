import { makeSuccess, makeSyncFunc } from 'freedom-async';

import type { SyncableStoreBackingFlatFileAccessor } from '../../../backing/SyncableStoreBackingFlatFileAccessor.ts';
import type { InMemorySyncableStoreBackingFlatFileItem } from '../types/InMemorySyncableStoreBackingFlatFileItem.ts';

export const makeFlatFileAccessor = makeSyncFunc(
  [import.meta.filename],
  (_trace, item: InMemorySyncableStoreBackingFlatFileItem): SyncableStoreBackingFlatFileAccessor => {
    const data = item.data;
    return {
      type: 'flatFile',
      id: item.id,
      getBinary: async () => makeSuccess(data)
    };
  }
);
