import type { SyncableFileMetadata } from '../metadata/SyncableFileMetadata.ts';

export interface OutOfSyncFile {
  type: 'file';
  outOfSync: true;
  data?: Uint8Array;
  metadata: SyncableFileMetadata;
}
