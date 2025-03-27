import type { PRFunc } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';

export interface SyncableStoreBackingFileAccessor {
  type: 'file';
  id: SyncableId;
  getBinary: PRFunc<Uint8Array>;
}
