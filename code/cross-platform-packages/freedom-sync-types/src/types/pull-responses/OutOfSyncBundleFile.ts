import type { Sha256Hash } from 'freedom-basic-data';

import type { SyncableBundleFileMetadata } from '../metadata/SyncableBundleFileMetadata.ts';
import type { SyncableId } from '../SyncableId.ts';

export interface OutOfSyncBundleFile {
  type: 'bundleFile';
  outOfSync: true;
  hashesById: Partial<Record<SyncableId, Sha256Hash>>;
  metadata: SyncableBundleFileMetadata;
}
