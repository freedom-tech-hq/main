import type { Sha256Hash } from 'freedom-basic-data';
import type { SyncableItemType, SyncableProvenance } from 'freedom-sync-types';

export interface SyncableStoreBackingMetadata {
  hash?: Sha256Hash;
  provenance: SyncableProvenance;
  type: SyncableItemType;
}
