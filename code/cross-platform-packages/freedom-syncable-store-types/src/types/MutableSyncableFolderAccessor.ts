import type { AccessChangeParams } from 'freedom-access-control-types';
import type { PRFunc } from 'freedom-async';

import type { FolderManagement } from './FolderManagement.ts';
import type { MutableFileStore } from './MutableFileStore.ts';
import type { MutableFolderStore } from './MutableFolderStore.ts';
import type { SyncableFolderAccessor } from './SyncableFolderAccessor.ts';
import type { SyncableStoreRole } from './SyncableStoreRole.ts';

export interface MutableSyncableFolderAccessor extends SyncableFolderAccessor, MutableFileStore, MutableFolderStore, FolderManagement {
  readonly type: 'folder';

  /** Updates access levels */
  readonly updateAccess: PRFunc<undefined, 'conflict', [change: AccessChangeParams<SyncableStoreRole>]>;
}
