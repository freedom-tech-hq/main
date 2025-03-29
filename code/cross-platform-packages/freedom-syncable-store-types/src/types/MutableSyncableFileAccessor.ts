import type { PRFunc } from 'freedom-async';
import type { SyncableItemMetadata } from 'freedom-sync-types';

import type { MutableSyncableItemAccessorBase } from './MutableSyncableItemAccessorBase.ts';
import type { SyncableFileAccessor } from './SyncableFileAccessor.ts';

export interface MutableSyncableFileAccessor extends MutableSyncableItemAccessorBase, SyncableFileAccessor {
  readonly type: 'file';

  /** Gets the metadata */
  readonly getMetadata: PRFunc<SyncableItemMetadata>;
}
