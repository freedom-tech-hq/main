import type { AccessChangeParams } from 'freedom-access-control-types';
import type { PRFunc } from 'freedom-async';

import type { AccessControlledFolderAccessor } from './AccessControlledFolderAccessor.ts';
import type { FolderManagement } from './FolderManagement.ts';
import type { MutableFileStore } from './MutableFileStore.ts';
import type { MutableFolderStore } from './MutableFolderStore.ts';
import type { SyncableStoreRole } from './SyncableStoreRole.ts';

export interface MutableAccessControlledFolderAccessor
  extends AccessControlledFolderAccessor,
    MutableFileStore,
    MutableFolderStore,
    FolderManagement {
  /** Updates access levels */
  readonly updateAccess: PRFunc<undefined, 'conflict', [change: AccessChangeParams<SyncableStoreRole>]>;
}
