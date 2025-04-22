import type { SyncableBundleAccessor } from './SyncableBundleAccessor.ts';
import type { SyncableFileAccessor } from './SyncableFileAccessor.ts';
import type { SyncableFolderAccessor } from './SyncableFolderAccessor.ts';

export type SyncableItemAccessor = SyncableBundleAccessor | SyncableFileAccessor | SyncableFolderAccessor;
