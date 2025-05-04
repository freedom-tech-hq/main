import type { AccessChangeParams } from 'freedom-access-control-types';
import type { PRFunc } from 'freedom-async';
import type { SyncableItemMetadata } from 'freedom-sync-types';

import type { SyncableFolderAccessor } from '../immutable/SyncableFolderAccessor.ts';
import type { SyncableStoreRole } from '../SyncableStoreRole.ts';
import type { MutableFileStore } from './MutableFileStore.ts';
import type { MutableFolderStore } from './MutableFolderStore.ts';

export interface MutableSyncableFolderAccessor extends SyncableFolderAccessor, MutableFileStore, MutableFolderStore {
  readonly type: 'folder';

  /** Gets the metadata */
  readonly getMetadata: PRFunc<SyncableItemMetadata>;

  /** Updates access levels */
  readonly updateAccess: PRFunc<undefined, 'conflict', [change: AccessChangeParams<SyncableStoreRole>]>;
}
