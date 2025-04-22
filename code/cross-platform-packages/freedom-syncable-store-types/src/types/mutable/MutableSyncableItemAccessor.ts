import type { SyncableItemAccessor } from '../immutable/SyncableItemAccessor.ts';
import type { MutableSyncableBundleAccessor } from './MutableSyncableBundleAccessor.ts';
import type { MutableSyncableFileAccessor } from './MutableSyncableFileAccessor.ts';
import type { MutableSyncableFolderAccessor } from './MutableSyncableFolderAccessor.ts';

export type MutableSyncableItemAccessor = SyncableItemAccessor &
  (MutableSyncableBundleAccessor | MutableSyncableFileAccessor | MutableSyncableFolderAccessor);
