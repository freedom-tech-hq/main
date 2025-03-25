import type { SyncableId } from 'freedom-sync-types';

export interface SyncableStoreBackingBundleFileAccessor {
  readonly type: 'bundleFile';
  readonly id: SyncableId;
}
