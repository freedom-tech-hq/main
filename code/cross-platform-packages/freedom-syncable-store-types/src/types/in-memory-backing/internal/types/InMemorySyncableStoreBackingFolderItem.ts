import type { SyncableBundleFileMetadata, SyncableFolderMetadata, SyncableId } from 'freedom-sync-types';

import type { LocalItemMetadata } from '../../../backing/LocalItemMetadata.ts';
import type { InMemorySyncableStoreBackingItem } from './InMemorySyncableStoreBackingItem.ts';

export type InMemorySyncableStoreBackingFolderItem = {
  type: 'folder';
  id: SyncableId;
  metadata: (SyncableBundleFileMetadata | SyncableFolderMetadata) & LocalItemMetadata;
  contents: Partial<Record<SyncableId, InMemorySyncableStoreBackingItem>>;
};
