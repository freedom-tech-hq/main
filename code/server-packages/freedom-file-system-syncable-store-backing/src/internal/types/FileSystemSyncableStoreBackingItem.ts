import type { FileSystemSyncableStoreBackingFlatFileItem } from './FileSystemSyncableStoreBackingFlatFileItem.ts';
import type { FileSystemSyncableStoreBackingFolderItem } from './FileSystemSyncableStoreBackingFolderItem.ts';

export type FileSystemSyncableStoreBackingItem = FileSystemSyncableStoreBackingFolderItem | FileSystemSyncableStoreBackingFlatFileItem;
