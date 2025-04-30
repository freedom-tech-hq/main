import type { PRFunc } from 'freedom-async';
import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { OpfsLocalItemMetadata } from './OpfsLocalItemMetadata.ts';

export interface OpfsSyncableStoreBackingFileItem {
  readonly type: 'file';
  readonly id: SyncableId;
  readonly exists: PRFunc<boolean, 'wrong-type'>;
  readonly metadata: PRFunc<SyncableItemMetadata & OpfsLocalItemMetadata, 'not-found' | 'wrong-type'>;
  readonly data: PRFunc<Uint8Array, 'not-found' | 'wrong-type'>;
}
