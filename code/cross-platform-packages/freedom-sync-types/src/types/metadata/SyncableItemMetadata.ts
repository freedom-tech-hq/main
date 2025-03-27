import type { SyncableBundleMetadata } from './SyncableBundleMetadata.ts';
import type { SyncableFlatFileMetadata } from './SyncableFlatFileMetadata.ts';
import type { SyncableFolderMetadata } from './SyncableFolderMetadata.ts';

export type SyncableItemMetadata = SyncableBundleMetadata | SyncableFlatFileMetadata | SyncableFolderMetadata;
