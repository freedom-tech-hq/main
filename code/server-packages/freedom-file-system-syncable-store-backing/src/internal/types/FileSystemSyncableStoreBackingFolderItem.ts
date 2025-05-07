import type { PRFunc } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';

import type { FileSystemSyncableStoreBackingItem } from './FileSystemSyncableStoreBackingItem.ts';

export interface FileSystemSyncableStoreBackingFolderItem {
  readonly type: 'folder';
  readonly id: SyncableId;
  readonly exists: PRFunc<boolean, 'wrong-type', [id?: SyncableId]>;
  readonly get: PRFunc<FileSystemSyncableStoreBackingItem, 'not-found' | 'wrong-type', [id: SyncableId]>;
  readonly metadata: PRFunc<SyncableStoreBackingItemMetadata, 'not-found' | 'wrong-type'>;
  readonly contents: PRFunc<Partial<Record<SyncableId, FileSystemSyncableStoreBackingItem>>, 'not-found' | 'wrong-type'>;
}
