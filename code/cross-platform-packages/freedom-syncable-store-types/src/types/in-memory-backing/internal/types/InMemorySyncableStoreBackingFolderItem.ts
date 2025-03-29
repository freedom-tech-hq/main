import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { LocalItemMetadata } from '../../../LocalItemMetadata.ts';
import type { InMemorySyncableStoreBackingItem } from './InMemorySyncableStoreBackingItem.ts';

export interface InMemorySyncableStoreBackingFolderItem {
  readonly type: 'folder';
  readonly id: SyncableId;
  readonly contents: Partial<Record<SyncableId, InMemorySyncableStoreBackingItem>>;
  readonly metadata: SyncableItemMetadata & LocalItemMetadata;
}
