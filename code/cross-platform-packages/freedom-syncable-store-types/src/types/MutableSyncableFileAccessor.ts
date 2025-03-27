import type { MutableSyncableItemAccessorBase } from './MutableSyncableItemAccessorBase.ts';
import type { SyncableFileAccessor } from './SyncableFileAccessor.ts';

export interface MutableSyncableFileAccessor extends MutableSyncableItemAccessorBase, SyncableFileAccessor {
  readonly type: 'file';
}
