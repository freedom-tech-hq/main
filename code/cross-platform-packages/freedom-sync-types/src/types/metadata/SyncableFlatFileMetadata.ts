import type { SyncableItemMetadataBase } from './SyncableItemMetadataBase.ts';

export interface SyncableFlatFileMetadata extends SyncableItemMetadataBase {
  type: 'flatFile';
}
