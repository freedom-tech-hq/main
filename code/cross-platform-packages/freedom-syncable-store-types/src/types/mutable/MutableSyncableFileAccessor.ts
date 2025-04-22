import type { PRFunc } from 'freedom-async';
import type { SyncableItemMetadata } from 'freedom-sync-types';

import type { SyncableFileAccessor } from '../immutable/SyncableFileAccessor.ts';
import type { MutableSyncableItemAccessorBase } from './MutableSyncableItemAccessorBase.ts';

export interface MutableSyncableFileAccessor extends MutableSyncableItemAccessorBase, SyncableFileAccessor {
  readonly type: 'file';

  /** Gets the metadata */
  readonly getMetadata: PRFunc<SyncableItemMetadata>;
}
