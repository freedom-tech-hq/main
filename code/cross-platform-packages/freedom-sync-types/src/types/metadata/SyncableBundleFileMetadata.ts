import type { SyncableItemMetadataBase } from './SyncableItemMetadataBase.ts';

export interface SyncableBundleFileMetadata extends SyncableItemMetadataBase {
  readonly type: 'bundleFile';
}
