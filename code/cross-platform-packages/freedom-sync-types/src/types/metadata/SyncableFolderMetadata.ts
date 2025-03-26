import type { SyncableItemMetadataBase } from './SyncableItemMetadataBase.ts';

export interface SyncableFolderMetadata extends SyncableItemMetadataBase {
  readonly type: 'folder';
  readonly encrypted: true;
}
