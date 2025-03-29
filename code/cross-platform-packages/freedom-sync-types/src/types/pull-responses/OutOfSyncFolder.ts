import type { Sha256Hash } from 'freedom-basic-data';

import type { SyncableItemMetadata } from '../metadata/SyncableItemMetadata.ts';
import type { SyncableId } from '../SyncableId.ts';

export interface OutOfSyncFolder {
  type: 'folder';
  outOfSync: true;
  hashesById: Partial<Record<SyncableId, Sha256Hash>>;
  metadata: SyncableItemMetadata;
}
