import type { SyncableItemMetadata } from '../metadata/SyncableItemMetadata.ts';

export interface OutOfSyncFile {
  type: 'file';
  outOfSync: true;
  data?: Uint8Array;
  metadata: SyncableItemMetadata;
}
