import type { MutableSyncableBundleAccessor } from './MutableSyncableBundleAccessor.ts';
import type { MutableSyncableFileAccessor } from './MutableSyncableFileAccessor.ts';
import type { MutableSyncableFolderAccessor } from './MutableSyncableFolderAccessor.ts';
import type { SyncableItemAccessor } from './SyncableItemAccessor.ts';

export type MutableSyncableItemAccessor = SyncableItemAccessor &
  (MutableSyncableBundleAccessor | MutableSyncableFileAccessor | MutableSyncableFolderAccessor);
