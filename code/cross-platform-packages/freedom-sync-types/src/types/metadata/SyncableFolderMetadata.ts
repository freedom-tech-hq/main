import type { SyncableItemMetadataBase } from './SyncableItemMetadataBase.ts';

export interface SyncableFolderMetadata extends SyncableItemMetadataBase {
  type: 'folder';
  encrypted: true;
}
