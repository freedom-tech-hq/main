import type { Sha256Hash } from 'freedom-basic-data';

import type { SyncableBundleMetadata } from '../metadata/SyncableBundleMetadata.ts';
import type { SyncableId } from '../SyncableId.ts';

export interface OutOfSyncBundle {
  type: 'bundle';
  outOfSync: true;
  hashesById: Partial<Record<SyncableId, Sha256Hash>>;
  metadata: SyncableBundleMetadata;
}
