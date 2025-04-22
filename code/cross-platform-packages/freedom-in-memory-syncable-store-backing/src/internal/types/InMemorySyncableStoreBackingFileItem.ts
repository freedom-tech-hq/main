import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';
import type { LocalItemMetadata } from 'freedom-syncable-store-backing-types';

export interface InMemorySyncableStoreBackingFileItem {
  readonly type: 'file';
  readonly id: SyncableId;
  readonly metadata: SyncableItemMetadata & LocalItemMetadata;
  readonly data: Uint8Array;
}
