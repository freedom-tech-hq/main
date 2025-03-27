import type { SyncableFlatFileMetadata } from '../metadata/SyncableFlatFileMetadata.ts';

export interface OutOfSyncFlatFile {
  type: 'flatFile';
  outOfSync: true;
  data?: Uint8Array;
  metadata: SyncableFlatFileMetadata;
}
