import type { SyncableItemType } from '../SyncableItemType.ts';
import type { SyncableProvenance } from '../SyncableProvenance.ts';

export interface SyncableItemMetadataBase {
  provenance: SyncableProvenance;
  type: SyncableItemType;
  encrypted: boolean;
}
