import type { SyncableProvenance } from '../SyncableProvenance.ts';

export interface OutOfSyncFlatFile {
  type: 'flatFile';
  outOfSync: true;
  data?: Uint8Array;
  provenance: SyncableProvenance;
}
