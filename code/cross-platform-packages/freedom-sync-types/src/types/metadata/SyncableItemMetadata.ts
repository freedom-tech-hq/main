import type { SyncableBundleMetadata } from './SyncableBundleMetadata.ts';
import type { SyncableFileMetadata } from './SyncableFileMetadata.ts';
import type { SyncableFolderMetadata } from './SyncableFolderMetadata.ts';

export type SyncableItemMetadata = SyncableBundleMetadata | SyncableFileMetadata | SyncableFolderMetadata;
