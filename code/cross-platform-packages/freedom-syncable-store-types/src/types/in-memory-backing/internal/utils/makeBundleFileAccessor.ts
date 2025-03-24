import { makeSyncFunc } from 'freedom-async';

import type { SyncableStoreBackingBundleFileAccessor } from '../../../backing/SyncableStoreBackingBundleFileAccessor.ts';
import type { InMemorySyncableStoreBackingBundleFileItem } from '../types/InMemorySyncableStoreBackingBundleFileItem.ts';

export const makeBundleFileAccessor = makeSyncFunc(
  [import.meta.filename],
  (_trace, item: InMemorySyncableStoreBackingBundleFileItem): SyncableStoreBackingBundleFileAccessor => ({
    type: 'bundleFile',
    id: item.id
  })
);
