import type { Sha256Hash } from 'freedom-basic-data';

import type { SyncableItemMetadata } from '../metadata/SyncableItemMetadata.ts';
import type { SyncableId } from '../SyncableId.ts';

export interface OutOfSyncBundle {
  type: 'bundle';
  outOfSync: true;
  hashesById: Partial<Record<SyncableId, Sha256Hash>>;
  metadata: SyncableItemMetadata;
}
