import type { SyncableItemType } from '../SyncableItemType.ts';
import type { SyncableProvenance } from '../SyncableProvenance.ts';

export interface SyncableItemMetadataBase {
  readonly provenance: SyncableProvenance;
  readonly type: SyncableItemType;
  readonly encrypted: boolean;
}
