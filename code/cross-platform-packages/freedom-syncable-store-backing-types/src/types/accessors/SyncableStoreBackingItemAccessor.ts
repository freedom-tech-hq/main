import type { SyncableStoreBackingFileAccessor } from './SyncableStoreBackingFileAccessor.ts';
import type { SyncableStoreBackingFolderAccessor } from './SyncableStoreBackingFolderAccessor.ts';

export type SyncableStoreBackingItemAccessor = SyncableStoreBackingFolderAccessor | SyncableStoreBackingFileAccessor;
