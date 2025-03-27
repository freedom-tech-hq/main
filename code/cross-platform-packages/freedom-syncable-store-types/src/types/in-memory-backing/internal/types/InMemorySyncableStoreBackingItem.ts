import type { InMemorySyncableStoreBackingFlatFileItem } from './InMemorySyncableStoreBackingFlatFileItem.ts';
import type { InMemorySyncableStoreBackingFolderItem } from './InMemorySyncableStoreBackingFolderItem.ts';

export type InMemorySyncableStoreBackingItem = InMemorySyncableStoreBackingFolderItem | InMemorySyncableStoreBackingFlatFileItem;
