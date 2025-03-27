import type { MutableSyncableBundleAccessor } from './MutableSyncableBundleAccessor.ts';
import type { MutableSyncableFlatFileAccessor } from './MutableSyncableFlatFileAccessor.ts';
import type { MutableSyncableFolderAccessor } from './MutableSyncableFolderAccessor.ts';
import type { SyncableItemAccessor } from './SyncableItemAccessor.ts';

export type MutableSyncableItemAccessor = SyncableItemAccessor &
  (MutableSyncableBundleAccessor | MutableSyncableFlatFileAccessor | MutableSyncableFolderAccessor);
