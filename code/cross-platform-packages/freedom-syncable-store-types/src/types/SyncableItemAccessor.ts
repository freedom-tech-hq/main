import type { SyncableBundleAccessor } from './SyncableBundleAccessor.ts';
import type { SyncableFlatFileAccessor } from './SyncableFlatFileAccessor.ts';
import type { SyncableFolderAccessor } from './SyncableFolderAccessor.ts';

export type SyncableItemAccessor = SyncableBundleAccessor | SyncableFlatFileAccessor | SyncableFolderAccessor;
