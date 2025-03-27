import { makeSyncFunc } from 'freedom-async';
import type { SyncableStoreBackingItemAccessor } from 'freedom-syncable-store-types';

import type { FileSystemSyncableStoreBackingItem } from '../types/FileSystemSyncableStoreBackingItem.ts';
import { makeFileAccessor } from './makeFileAccessor.ts';
import { makeFolderAccessor } from './makeFolderAccessor.ts';

export const makeItemAccessor = makeSyncFunc(
  [import.meta.filename],
  (trace, item: FileSystemSyncableStoreBackingItem): SyncableStoreBackingItemAccessor => {
    switch (item.type) {
      case 'folder':
        return makeFolderAccessor(trace, item);

      case 'file':
        return makeFileAccessor(trace, item);
    }
  }
);
