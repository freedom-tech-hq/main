import type { MutableSyncableItemAccessorBase } from './MutableSyncableItemAccessorBase.ts';
import type { SyncableFlatFileAccessor } from './SyncableFlatFileAccessor.ts';

export interface MutableSyncableFlatFileAccessor extends MutableSyncableItemAccessorBase, SyncableFlatFileAccessor {
  readonly type: 'flatFile';
}
