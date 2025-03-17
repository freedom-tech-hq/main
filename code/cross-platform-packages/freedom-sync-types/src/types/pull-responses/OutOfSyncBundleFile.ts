import type { Sha256Hash } from 'freedom-basic-data';

import type { SyncableId } from '../SyncableId.ts';
import type { SyncableProvenance } from '../SyncableProvenance.ts';

export interface OutOfSyncBundleFile {
  type: 'bundleFile';
  outOfSync: true;
  hashesById: Partial<Record<SyncableId, Sha256Hash>>;
  provenance: SyncableProvenance;
}
