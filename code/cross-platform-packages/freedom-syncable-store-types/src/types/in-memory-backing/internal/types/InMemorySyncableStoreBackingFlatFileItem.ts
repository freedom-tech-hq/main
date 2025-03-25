import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { LocalItemMetadata } from '../../../backing/LocalItemMetadata.ts';

export type InMemorySyncableStoreBackingFlatFileItem = {
  type: 'flatFile';
  id: SyncableId;
  metadata: SyncableItemMetadata & { type: 'flatFile' } & LocalItemMetadata;
  data: Uint8Array;
};
