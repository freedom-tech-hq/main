import type { SyncableItemMetadataBase } from './SyncableItemMetadataBase.ts';

export interface SyncableFileMetadata extends SyncableItemMetadataBase {
  readonly type: 'file';
}
