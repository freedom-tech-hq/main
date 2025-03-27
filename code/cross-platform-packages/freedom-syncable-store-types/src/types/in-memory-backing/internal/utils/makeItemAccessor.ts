import { makeSyncFunc } from 'freedom-async';

import type { SyncableStoreBackingItemAccessor } from '../../../backing/accessors/SyncableStoreBackingItemAccessor.ts';
import type { InMemorySyncableStoreBackingItem } from '../types/InMemorySyncableStoreBackingItem.ts';
import { makeFileAccessor } from './makeFileAccessor.ts';
import { makeFolderAccessor } from './makeFolderAccessor.ts';

export const makeItemAccessor = makeSyncFunc(
  [import.meta.filename],
  (trace, item: InMemorySyncableStoreBackingItem): SyncableStoreBackingItemAccessor => {
    switch (item.type) {
      case 'folder':
        return makeFolderAccessor(trace, item);

      case 'file':
        return makeFileAccessor(trace, item);
    }
  }
);
