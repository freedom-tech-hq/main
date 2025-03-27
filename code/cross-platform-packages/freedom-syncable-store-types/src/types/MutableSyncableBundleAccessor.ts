import type { BundleManagement } from './BundleManagement.ts';
import type { MutableFileStore } from './MutableFileStore.ts';
import type { MutableSyncableItemAccessorBase } from './MutableSyncableItemAccessorBase.ts';
import type { SyncableBundleAccessor } from './SyncableBundleAccessor.ts';

export interface MutableSyncableBundleAccessor
  extends SyncableBundleAccessor,
    MutableSyncableItemAccessorBase,
    MutableFileStore,
    BundleManagement {
  readonly type: 'bundle';
}
