import type { SyncableBundleAccessor } from '../immutable/SyncableBundleAccessor.ts';
import type { MutableFileStore } from './MutableFileStore.ts';
import type { MutableSyncableItemAccessorBase } from './MutableSyncableItemAccessorBase.ts';

export interface MutableSyncableBundleAccessor extends SyncableBundleAccessor, MutableSyncableItemAccessorBase, MutableFileStore {
  readonly type: 'bundle';
}
