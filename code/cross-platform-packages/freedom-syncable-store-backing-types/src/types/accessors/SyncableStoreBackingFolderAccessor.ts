import type { SyncableId } from 'freedom-sync-types';

export interface SyncableStoreBackingFolderAccessor {
  readonly type: 'folder';
  readonly id: SyncableId;
}
