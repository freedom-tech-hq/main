import type { PRFunc } from 'freedom-async';

import type { BundleManagement } from './BundleManagement.ts';
import type { FolderManagement } from './FolderManagement.ts';
import type { MutableSyncableFolderAccessor } from './MutableSyncableFolderAccessor.ts';
import type { SyncableStore } from './SyncableStore.ts';

export interface MutableSyncableStore extends SyncableStore, MutableSyncableFolderAccessor, FolderManagement, BundleManagement {
  /** Initializes the folder for use and sets initial access settings.  This must be done exactly once for locally-created folders. */
  readonly initialize: PRFunc<undefined, 'conflict'>;
}
