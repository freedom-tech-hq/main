import type { PRFunc } from 'freedom-async';
import type { SyncableItemMetadata } from 'freedom-sync-types';

import type { BundleManagement } from '../BundleManagement.ts';
import type { SyncableBundleAccessor } from '../immutable/SyncableBundleAccessor.ts';
import type { MutableFileStore } from './MutableFileStore.ts';
import type { MutableSyncableItemAccessorBase } from './MutableSyncableItemAccessorBase.ts';

export interface MutableSyncableBundleAccessor
  extends SyncableBundleAccessor,
    MutableSyncableItemAccessorBase,
    MutableFileStore,
    BundleManagement {
  readonly type: 'bundle';

  /** Gets the metadata */
  readonly getMetadata: PRFunc<SyncableItemMetadata>;
}
