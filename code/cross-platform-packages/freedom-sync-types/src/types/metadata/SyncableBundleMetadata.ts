import type { SyncableItemMetadataBase } from './SyncableItemMetadataBase.ts';

export interface SyncableBundleMetadata extends SyncableItemMetadataBase {
  readonly type: 'bundle';
}
