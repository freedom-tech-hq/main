import type { PRFunc } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';

export interface FileSystemSyncableStoreBackingFileItem {
  readonly type: 'file';
  readonly id: SyncableId;
  readonly exists: PRFunc<boolean, 'wrong-type'>;
  readonly metadata: PRFunc<SyncableStoreBackingItemMetadata, 'not-found' | 'wrong-type'>;
  readonly data: PRFunc<Uint8Array, 'not-found' | 'wrong-type'>;
}
