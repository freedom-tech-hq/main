import type { SyncableId } from 'freedom-sync-types';

import type { SyncableStoreBackingMetadata } from '../../../backing/SyncableStoreBackingMetadata.ts';
import type { InMemorySyncableStoreBackingItem } from './InMemorySyncableStoreBackingItem.ts';

export type InMemorySyncableStoreBackingFolderItem = {
  type: 'folder';
  id: SyncableId;
  metadata: SyncableStoreBackingMetadata & { type: 'folder' };
  contents: Partial<Record<SyncableId, InMemorySyncableStoreBackingItem>>;
};
