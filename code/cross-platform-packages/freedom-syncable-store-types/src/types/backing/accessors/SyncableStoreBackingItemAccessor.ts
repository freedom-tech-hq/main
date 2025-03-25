import type { SyncableStoreBackingBundleFileAccessor } from './SyncableStoreBackingBundleFileAccessor.ts';
import type { SyncableStoreBackingFlatFileAccessor } from './SyncableStoreBackingFlatFileAccessor.ts';
import type { SyncableStoreBackingFolderAccessor } from './SyncableStoreBackingFolderAccessor.ts';

export type SyncableStoreBackingItemAccessor =
  | SyncableStoreBackingFolderAccessor
  | SyncableStoreBackingBundleFileAccessor
  | SyncableStoreBackingFlatFileAccessor;
