import type { SyncableItemMetadataBase } from './SyncableItemMetadataBase.ts';

export interface SyncableFlatFileMetadata extends SyncableItemMetadataBase {
  readonly type: 'flatFile';
}
