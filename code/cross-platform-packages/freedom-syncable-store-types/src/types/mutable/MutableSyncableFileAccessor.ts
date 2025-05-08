import type { SyncableFileAccessor } from '../immutable/SyncableFileAccessor.ts';
import type { MutableSyncableItemAccessorBase } from './MutableSyncableItemAccessorBase.ts';

export interface MutableSyncableFileAccessor extends MutableSyncableItemAccessorBase, SyncableFileAccessor {
  readonly type: 'file';
}
