import type { SyncableId } from 'freedom-sync-types';

import type { SyncableStoreBackingMetadata } from '../../../backing/SyncableStoreBackingMetadata.ts';

export type InMemorySyncableStoreBackingFlatFileItem = {
  type: 'flatFile';
  id: SyncableId;
  metadata: SyncableStoreBackingMetadata & { type: 'flatFile' };
  data: Uint8Array;
};
