import type { SyncableId } from 'freedom-sync-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';

import type { InMemorySyncableStoreBackingItem } from './InMemorySyncableStoreBackingItem.ts';

export interface InMemorySyncableStoreBackingFolderItem {
  readonly type: 'folder';
  readonly id: SyncableId;
  readonly contents: Partial<Record<SyncableId, InMemorySyncableStoreBackingItem>>;
  readonly metadata: SyncableStoreBackingItemMetadata;
}
