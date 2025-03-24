import type { SyncableId } from 'freedom-sync-types';

import type { SyncableStoreBackingMetadata } from '../../../backing/SyncableStoreBackingMetadata.ts';
import type { InMemorySyncableStoreBackingItem } from './InMemorySyncableStoreBackingItem.ts';

export type InMemorySyncableStoreBackingBundleFileItem = {
  type: 'bundleFile';
  id: SyncableId;
  metadata: SyncableStoreBackingMetadata & { type: 'bundleFile' };
  contents: Partial<Record<SyncableId, InMemorySyncableStoreBackingItem>>;
};
