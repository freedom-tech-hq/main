import type { SyncableItemMetadataBase } from './SyncableItemMetadataBase.ts';

export interface SyncableBundleFileMetadata extends SyncableItemMetadataBase {
  type: 'bundleFile';
}
