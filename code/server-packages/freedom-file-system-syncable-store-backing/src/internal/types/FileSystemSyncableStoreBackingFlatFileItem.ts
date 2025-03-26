import type { PRFunc } from 'freedom-async';
import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { FileSystemLocalItemMetadata } from './FileSystemLocalItemMetadata.ts';

export interface FileSystemSyncableStoreBackingFlatFileItem {
  readonly type: 'flatFile';
  readonly id: SyncableId;
  readonly metadata: PRFunc<SyncableItemMetadata & { type: 'flatFile' } & FileSystemLocalItemMetadata, 'not-found' | 'wrong-type'>;
  readonly data: PRFunc<Uint8Array, 'not-found' | 'wrong-type'>;
}
