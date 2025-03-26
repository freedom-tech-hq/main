import type { SyncableBundleFileMetadata, SyncableFolderMetadata, SyncableId } from 'freedom-sync-types';

import type { LocalItemMetadata } from '../../../backing/LocalItemMetadata.ts';
import type { InMemorySyncableStoreBackingItem } from './InMemorySyncableStoreBackingItem.ts';

export interface InMemorySyncableStoreBackingFolderItem {
  readonly type: 'folder';
  readonly id: SyncableId;
  readonly contents: Partial<Record<SyncableId, InMemorySyncableStoreBackingItem>>;
  readonly metadata: (SyncableBundleFileMetadata | SyncableFolderMetadata) & LocalItemMetadata;
}
