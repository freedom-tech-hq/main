import type { PRFunc } from 'freedom-async';
import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { FileSystemLocalItemMetadata } from './FileSystemLocalItemMetadata.ts';
import type { FileSystemSyncableStoreBackingItem } from './FileSystemSyncableStoreBackingItem.ts';

export interface FileSystemSyncableStoreBackingFolderItem {
  readonly type: 'folder';
  readonly id: SyncableId;
  readonly metadata: PRFunc<SyncableItemMetadata & FileSystemLocalItemMetadata, 'not-found' | 'wrong-type'>;
  readonly contents: PRFunc<Partial<Record<SyncableId, FileSystemSyncableStoreBackingItem>>, 'not-found' | 'wrong-type'>;
}
