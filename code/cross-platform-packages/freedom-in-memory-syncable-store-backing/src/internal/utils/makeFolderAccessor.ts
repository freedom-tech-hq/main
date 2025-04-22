import { makeSyncFunc } from 'freedom-async';
import type { SyncableStoreBackingFolderAccessor } from 'freedom-syncable-store-backing-types';

import type { InMemorySyncableStoreBackingFolderItem } from '../types/InMemorySyncableStoreBackingFolderItem.ts';

export const makeFolderAccessor = makeSyncFunc(
  [import.meta.filename],
  (_trace, item: InMemorySyncableStoreBackingFolderItem): SyncableStoreBackingFolderAccessor => ({
    type: 'folder',
    id: item.id
  })
);
