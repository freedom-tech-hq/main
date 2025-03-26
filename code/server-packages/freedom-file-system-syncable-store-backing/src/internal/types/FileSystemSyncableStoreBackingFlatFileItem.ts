import type { PRFunc } from 'freedom-async';
import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';
import type { LocalItemMetadata } from 'freedom-syncable-store-types';

export interface FileSystemSyncableStoreBackingFlatFileItem {
  readonly type: 'flatFile';
  readonly id: SyncableId;
  readonly metadata: PRFunc<SyncableItemMetadata & { type: 'flatFile' } & LocalItemMetadata, 'not-found' | 'wrong-type'>;
  readonly data: PRFunc<Uint8Array, 'not-found' | 'wrong-type'>;
}
