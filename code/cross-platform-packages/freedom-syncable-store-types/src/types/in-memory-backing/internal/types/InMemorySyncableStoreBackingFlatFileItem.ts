import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { InMemoryLocalItemMetadata } from './InMemoryLocalItemMetadata.ts';

export interface InMemorySyncableStoreBackingFlatFileItem {
  readonly type: 'flatFile';
  readonly id: SyncableId;
  readonly metadata: SyncableItemMetadata & { type: 'flatFile' } & InMemoryLocalItemMetadata;
  readonly data: Uint8Array;
}
