import type { PRFunc } from 'freedom-async';
import type { SyncableBundleFileMetadata, SyncableFolderMetadata, SyncableId } from 'freedom-sync-types';
import type { LocalItemMetadata } from 'freedom-syncable-store-types';

import type { FileSystemSyncableStoreBackingItem } from './FileSystemSyncableStoreBackingItem.ts';

export interface FileSystemSyncableStoreBackingFolderItem {
  readonly type: 'folder';
  readonly id: SyncableId;
  readonly metadata: PRFunc<(SyncableBundleFileMetadata | SyncableFolderMetadata) & LocalItemMetadata, 'not-found' | 'wrong-type'>;
  readonly contents: PRFunc<Partial<Record<SyncableId, FileSystemSyncableStoreBackingItem>>, 'not-found' | 'wrong-type'>;
}
