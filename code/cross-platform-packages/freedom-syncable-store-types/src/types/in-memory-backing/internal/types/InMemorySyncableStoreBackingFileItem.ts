import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { LocalItemMetadata } from '../../../LocalItemMetadata.ts';

export interface InMemorySyncableStoreBackingFileItem {
  readonly type: 'file';
  readonly id: SyncableId;
  readonly metadata: SyncableItemMetadata & LocalItemMetadata;
  readonly data: Uint8Array;
}
