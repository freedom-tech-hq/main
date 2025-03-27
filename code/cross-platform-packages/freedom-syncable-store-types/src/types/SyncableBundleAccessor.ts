import type { FileStore } from './FileStore.ts';
import type { SyncableItemAccessorBase } from './SyncableItemAccessorBase.ts';

export interface SyncableBundleAccessor extends SyncableItemAccessorBase, FileStore {
  readonly type: 'bundle';
}
