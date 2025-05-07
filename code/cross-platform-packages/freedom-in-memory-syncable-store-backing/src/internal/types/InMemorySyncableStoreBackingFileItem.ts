import type { SyncableId } from 'freedom-sync-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';

export interface InMemorySyncableStoreBackingFileItem {
  readonly type: 'file';
  readonly id: SyncableId;
  readonly metadata: SyncableStoreBackingItemMetadata;
  readonly data: Uint8Array;
}
