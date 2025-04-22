import { makeSyncFunc } from 'freedom-async';
import type { SyncableStoreBackingFolderAccessor } from 'freedom-syncable-store-backing-types';

import type { OpfsSyncableStoreBackingFolderItem } from '../types/OpfsSyncableStoreBackingFolderItem.ts';

export const makeFolderAccessor = makeSyncFunc(
  [import.meta.filename],
  (_trace, item: OpfsSyncableStoreBackingFolderItem): SyncableStoreBackingFolderAccessor => ({
    type: 'folder',
    id: item.id
  })
);
