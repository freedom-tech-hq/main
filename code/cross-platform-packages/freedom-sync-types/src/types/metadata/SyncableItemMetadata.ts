import type { SyncableBundleFileMetadata } from './SyncableBundleFileMetadata.ts';
import type { SyncableFlatFileMetadata } from './SyncableFlatFileMetadata.ts';
import type { SyncableFolderMetadata } from './SyncableFolderMetadata.ts';

export type SyncableItemMetadata = SyncableBundleFileMetadata | SyncableFlatFileMetadata | SyncableFolderMetadata;
