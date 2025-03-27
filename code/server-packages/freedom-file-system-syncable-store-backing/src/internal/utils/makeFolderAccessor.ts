import { makeSyncFunc } from 'freedom-async';
import type { SyncableStoreBackingFolderAccessor } from 'freedom-syncable-store-types';

import type { FileSystemSyncableStoreBackingFolderItem } from '../types/FileSystemSyncableStoreBackingFolderItem.ts';

export const makeFolderAccessor = makeSyncFunc(
  [import.meta.filename],
  (_trace, item: FileSystemSyncableStoreBackingFolderItem): SyncableStoreBackingFolderAccessor => ({
    type: 'folder',
    id: item.id
  })
);
