import type { PRFunc } from 'freedom-async';

import type { SyncableStore } from '../immutable/SyncableStore.ts';
import type { MutableSyncableFolderAccessor } from './MutableSyncableFolderAccessor.ts';

export interface MutableSyncableStore extends SyncableStore, MutableSyncableFolderAccessor {
  /** Initializes the folder for use and sets initial access settings.  This must be done exactly once for locally-created folders. */
  readonly initialize: PRFunc<undefined, 'conflict'>;
}
