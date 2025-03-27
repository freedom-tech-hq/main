import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { LocalItemMetadata } from '../../../LocalItemMetadata.ts';

export interface InMemorySyncableStoreBackingFlatFileItem {
  readonly type: 'flatFile';
  readonly id: SyncableId;
  readonly metadata: SyncableItemMetadata & { type: 'flatFile' } & LocalItemMetadata;
  readonly data: Uint8Array;
}
