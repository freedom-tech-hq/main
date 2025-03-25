import type { PRFunc } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';

export interface SyncableStoreBackingFlatFileAccessor {
  type: 'flatFile';
  id: SyncableId;
  getBinary: PRFunc<Uint8Array>;
}
