import { makeSyncFunc } from 'freedom-async';

import type { SyncableStoreBackingItemAccessor } from '../../../backing/SyncableStoreBackingItemAccessor.ts';
import type { InMemorySyncableStoreBackingItem } from '../types/InMemorySyncableStoreBackingItem.ts';
import { makeBundleFileAccessor } from './makeBundleFileAccessor.ts';
import { makeFlatFileAccessor } from './makeFlatFileAccessor.ts';
import { makeFolderAccessor } from './makeFolderAccessor.ts';

export const makeItemAccessor = makeSyncFunc(
  [import.meta.filename],
  (trace, item: InMemorySyncableStoreBackingItem): SyncableStoreBackingItemAccessor => {
    switch (item.type) {
      case 'bundleFile':
        return makeBundleFileAccessor(trace, item);

      case 'folder':
        return makeFolderAccessor(trace, item);

      case 'flatFile':
        return makeFlatFileAccessor(trace, item);
    }
  }
);
